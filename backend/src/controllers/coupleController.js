import Couple from '../models/couple.model.js';
import Photo from '../models/photo.model.js';
import Journal from '../models/journal.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { makeInviteCode } from '../utils/helpers.js';
import { notifyPartner } from './notificationController.js';
import { deleteManyByPublicIds } from '../lib/cloudinary.js';

const CODE_EXPIRY_MIN = 5; // invite codes die after 5 minutes (privacy)

function freshCode() {
  return {
    inviteCode: makeInviteCode(),
    inviteCodeExpires: new Date(Date.now() + CODE_EXPIRY_MIN * 60000),
  };
}

// POST /api/couple/create
// First partner creates the couple space and gets a short-lived invite code.
// If user is already in a solo couple (waiting for partner), regenerates the code.
export const createCouple = asyncHandler(async (req, res) => {
  if (req.user.couple) {
    const existing = await Couple.findById(req.user.couple);
    if (existing) {
      if (existing.members.length >= 2) {
        return res.status(400).json({ message: 'You are already paired with a partner' });
      }
      // Solo couple — refresh the invite code and return it
      const code = freshCode();
      existing.inviteCode = code.inviteCode;
      existing.inviteCodeExpires = code.inviteCodeExpires;
      await existing.save();
      return res.status(200).json({
        couple: existing,
        inviteCode: existing.inviteCode,
        expiresAt: existing.inviteCodeExpires,
      });
    }
    // Stale reference — couple document was deleted, clear and recreate
    req.user.couple = null;
  }

  const code = freshCode();
  const couple = await Couple.create({
    members: [req.user._id],
    inviteCode: code.inviteCode,
    inviteCodeExpires: code.inviteCodeExpires,
  });
  req.user.couple = couple._id;
  await req.user.save();
  res.status(201).json({
    couple,
    inviteCode: couple.inviteCode,
    expiresAt: couple.inviteCodeExpires,
  });
});

// POST /api/couple/regenerate
// Creating partner asks for a fresh code (e.g. the old one expired).
export const regenerateCode = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });
  if (couple.members.length >= 2) {
    return res.status(400).json({ message: 'You are already paired' });
  }
  const code = freshCode();
  couple.inviteCode = code.inviteCode;
  couple.inviteCodeExpires = code.inviteCodeExpires;
  await couple.save();
  res.json({ inviteCode: couple.inviteCode, expiresAt: couple.inviteCodeExpires });
});

// POST /api/couple/join   body: { inviteCode }
export const joinCouple = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (req.user.couple) {
    return res.status(400).json({ message: 'You are already in a couple' });
  }
  const couple = await Couple.findOne({ inviteCode: inviteCode?.trim() });
  if (!couple) return res.status(404).json({ message: 'Invalid invite code' });

  // Expired? (410 Gone signals the frontend to ask partner for a new one)
  if (couple.inviteCodeExpires && couple.inviteCodeExpires < new Date()) {
    return res
      .status(410)
      .json({ message: 'This code has expired — ask your partner for a new one' });
  }
  if (couple.members.length >= 2) {
    return res.status(400).json({ message: 'This couple is already full' });
  }

  couple.members.push(req.user._id);
  // Single-use: clear the code (and its expiry) the moment someone joins
  couple.inviteCode = undefined;
  couple.inviteCodeExpires = undefined;
  await couple.save();

  req.user.couple = couple._id;
  await req.user.save();

  res.json({ couple });
});

// GET /api/couple
export const getCouple = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple).populate(
    'members',
    'name accentColor avatar'
  );
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const daysTogether = couple.anniversary
    ? Math.floor((Date.now() - couple.anniversary.getTime()) / 86400000)
    : null;
  const daysUntilNextDate = couple.nextDate
    ? Math.ceil((couple.nextDate.getTime() - Date.now()) / 86400000)
    : null;

  const isPaired = couple.members.length >= 2;
  const today = new Date().toISOString().slice(0, 10);

  // Normalise moods: strip entries that are from a previous day
  const moods = {};
  if (couple.moods) {
    for (const [uid, entry] of Object.entries(couple.moods)) {
      if (entry?.date === today) moods[uid] = entry;
    }
  }

  res.json({ couple, daysTogether, daysUntilNextDate, isPaired, moods });
});

// PATCH /api/couple
export const updateCouple = asyncHandler(async (req, res) => {
  const { anniversary, nextDate, petName } = req.body;
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const renamed = petName !== undefined && petName !== couple.pet.name;
  if (anniversary !== undefined) couple.anniversary = anniversary;
  if (nextDate !== undefined) couple.nextDate = nextDate;
  if (petName !== undefined) couple.pet.name = petName;

  await couple.save();

  if (renamed) {
    notifyPartner(couple, req.user._id, 'pet_named', { petName: couple.pet.name });
  }

  res.json({ couple });
});

// POST /api/couple/leave
// Soft leave — removes the current user from the couple but does NOT wipe
// shared data. Useful during testing or when a user created a solo couple
// and wants to reset without destroying anything.
export const leaveCouple = asyncHandler(async (req, res) => {
  if (!req.user.couple) {
    return res.status(400).json({ message: "You're not in a couple" });
  }

  const couple = await Couple.findById(req.user.couple);

  if (couple) {
    couple.members = couple.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );

    if (couple.members.length === 0) {
      await couple.deleteOne();
    } else {
      couple.inviteCode = undefined;
      couple.inviteCodeExpires = undefined;
      await couple.save();
    }
  }

  req.user.couple = null;
  await req.user.save();

  res.json({ message: "Left couple" });
});

// PATCH /api/couple/mood   body: { emoji, label }
export const setMood = asyncHandler(async (req, res) => {
  const { emoji, label } = req.body;
  if (!emoji) return res.status(400).json({ message: 'emoji is required' });

  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const today = new Date().toISOString().slice(0, 10);
  const uid = req.user._id.toString();

  if (!couple.moods) couple.moods = {};
  couple.moods[uid] = { emoji, label: label || '', date: today };
  couple.markModified('moods');
  await couple.save();

  notifyPartner(couple, req.user._id, 'mood_update', { emoji, label });
  res.json({ moods: couple.moods });
});

// GET /api/couple/bucket
export const getBucketList = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple)
    .populate('bucketList.addedBy', 'name accentColor avatar')
    .populate('bucketList.completedBy', 'name');
  if (!couple) return res.status(404).json({ message: 'Couple not found' });
  res.json({ items: couple.bucketList });
});

// POST /api/couple/bucket   body: { text }
export const addBucketItem = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  couple.bucketList.push({ text: text.trim(), addedBy: req.user._id });
  await couple.save();

  await couple.populate('bucketList.addedBy', 'name accentColor avatar');
  res.status(201).json({ item: couple.bucketList[couple.bucketList.length - 1] });
});

// PATCH /api/couple/bucket/:id   — toggle complete / incomplete
export const toggleBucketItem = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const item = couple.bucketList.id(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  if (item.completedAt) {
    item.completedAt = null;
    item.completedBy = null;
  } else {
    item.completedAt = new Date();
    item.completedBy = req.user._id;
  }
  await couple.save();

  res.json({ item });
});

// DELETE /api/couple/bucket/:id
export const deleteBucketItem = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const item = couple.bucketList.id(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.deleteOne();
  await couple.save();
  res.json({ message: 'Deleted' });
});

// ── Love Jar ──────────────────────────────────────────────────────────────────

// GET /api/couple/jar
export const getLoveJar = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple)
    .populate('loveJar.addedBy', 'name accentColor avatar')
    .populate('loveJar.claimedBy', 'name');
  if (!couple) return res.status(404).json({ message: 'Couple not found' });
  res.json({ items: couple.loveJar });
});

// POST /api/couple/jar   body: { text }
export const addJarItem = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'text is required' });

  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  couple.loveJar.push({ text: text.trim(), addedBy: req.user._id });
  await couple.save();
  await couple.populate('loveJar.addedBy', 'name accentColor avatar');

  const item = couple.loveJar[couple.loveJar.length - 1];
  notifyPartner(couple, req.user._id, 'jar_item_added', { text: item.text });
  res.status(201).json({ item });
});

// PATCH /api/couple/jar/:id   — claim / unclaim
export const claimJarItem = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const item = couple.loveJar.id(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  if (item.claimedAt) {
    item.claimedAt = null;
    item.claimedBy = null;
  } else {
    item.claimedAt = new Date();
    item.claimedBy = req.user._id;
    notifyPartner(couple, req.user._id, 'jar_item_claimed', { text: item.text });
  }
  await couple.save();
  res.json({ item });
});

// DELETE /api/couple/jar/:id
export const deleteJarItem = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const item = couple.loveJar.id(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.deleteOne();
  await couple.save();
  res.json({ message: 'Deleted' });
});

// DELETE /api/couple/leave
// Hard dissolution — permanently ends the partnership and deletes ALL shared
// data for both users: photos (DB + Cloudinary), journals linked to the
// couple, notifications, streak, and the virtual pet. Both users are
// immediately returned to the unpaired state.
export const dissolveCouple = asyncHandler(async (req, res) => {
  if (!req.user.couple) {
    return res.status(400).json({ message: "You don't have a partner to leave" });
  }

  const couple = await Couple.findById(req.user.couple);

  if (!couple) {
    // Stale reference — just clear it
    req.user.couple = null;
    await req.user.save();
    return res.json({ message: "Left couple" });
  }

  // Solo couple (waiting for partner) — nothing to dissolve, just clean up
  if (couple.members.length < 2) {
    req.user.couple = null;
    await req.user.save();
    await couple.deleteOne();
    return res.json({ message: "Left couple" });
  }

  const coupleId = couple._id;
  const memberIds = couple.members; // both users

  // 1. Collect Cloudinary public IDs so we can clean up remote storage
  const photoRecords = await Photo.find({ couple: coupleId }).select('publicId').lean();
  const publicIds = photoRecords.map((p) => p.publicId).filter(Boolean);

  // 2. Delete all photos from the database
  await Photo.deleteMany({ couple: coupleId });

  // 3. Delete all journal entries that were written within this relationship
  await Journal.deleteMany({ couple: coupleId });

  // 4. Delete all in-app notifications for this couple
  await Notification.deleteMany({ couple: coupleId });

  // 5. Clear the couple reference on BOTH users atomically
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { couple: null } });

  // 6. Delete the couple document — this also removes the embedded pet and streak
  await couple.deleteOne();

  // 7. Fire-and-forget Cloudinary cleanup (network call; don't block the response)
  if (publicIds.length > 0) {
    deleteManyByPublicIds(publicIds).catch(() => {});
  }

  res.json({ message: "Partnership ended. All shared data has been permanently removed." });
});