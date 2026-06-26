import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { makeInviteCode } from '../utils/helpers.js';

const CODE_EXPIRY_MIN = 5; // invite codes die after 5 minutes (privacy)

function freshCode() {
  return {
    inviteCode: makeInviteCode(),
    inviteCodeExpires: new Date(Date.now() + CODE_EXPIRY_MIN * 60000),
  };
}

// POST /api/couple/create
// First partner creates the couple space and gets a short-lived invite code.
export const createCouple = asyncHandler(async (req, res) => {
  if (req.user.couple) {
    return res.status(400).json({ message: 'You are already in a couple' });
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

  // tell the frontend whether the pairing is complete (both partners present)
  const isPaired = couple.members.length >= 2;

  res.json({ couple, daysTogether, daysUntilNextDate, isPaired });
});

// PATCH /api/couple
export const updateCouple = asyncHandler(async (req, res) => {
  const { anniversary, nextDate, petName } = req.body;
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  if (anniversary !== undefined) couple.anniversary = anniversary;
  if (nextDate !== undefined) couple.nextDate = nextDate;
  if (petName !== undefined) couple.pet.name = petName;

  await couple.save();
  res.json({ couple });
});

// POST /api/couple/leave
// Removes the current user from their couple. If they were the only member
// left, the couple document is deleted. Lets users (and you, while testing)
// reset out of a half-paired or unwanted couple.
export const leaveCouple = asyncHandler(async (req, res) => {
  if (!req.user.couple) {
    return res.status(400).json({ message: "You're not in a couple" });
  }

  const couple = await Couple.findById(req.user.couple);

  if (couple) {
    // remove this user from the members list
    couple.members = couple.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );

    if (couple.members.length === 0) {
      // no one left → delete the whole couple
      await couple.deleteOne();
    } else {
      // a partner remains — clear any pending invite code and save
      couple.inviteCode = undefined;
      couple.inviteCodeExpires = undefined;
      await couple.save();
    }
  }

  // clear the link on the user
  req.user.couple = null;
  await req.user.save();

  res.json({ message: "Left couple" });
});