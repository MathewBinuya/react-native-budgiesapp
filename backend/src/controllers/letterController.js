import Letter from '../models/letter.model.js';
import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { notifyPartner } from './notificationController.js';

// POST /api/letters
export const sendLetter = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  if (!body?.trim()) return res.status(400).json({ message: 'Letter body is required' });

  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const partnerId = couple.members.find(
    (m) => m.toString() !== req.user._id.toString()
  );
  if (!partnerId) return res.status(400).json({ message: 'No partner found' });

  const letter = await Letter.create({
    couple: req.user.couple,
    from: req.user._id,
    to: partnerId,
    subject: subject?.trim() || '',
    body: body.trim(),
  });

  await letter.populate('from', 'name accentColor avatar');
  await letter.populate('to', 'name accentColor avatar');

  notifyPartner(couple, req.user._id, 'letter_received', { letterId: letter._id.toString() });

  res.status(201).json({ letter });
});

// GET /api/letters/inbox
export const getInbox = asyncHandler(async (req, res) => {
  const letters = await Letter.find({ to: req.user._id, deletedByRecipient: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('from', 'name accentColor avatar');
  res.json({ letters });
});

// GET /api/letters/sent
export const getSent = asyncHandler(async (req, res) => {
  const letters = await Letter.find({ from: req.user._id, deletedBySender: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('to', 'name accentColor avatar');
  res.json({ letters });
});

// GET /api/letters/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Letter.countDocuments({
    to: req.user._id,
    readAt: null,
    deletedByRecipient: false,
  });
  res.json({ count });
});

// GET /api/letters/:id — also marks as read
export const getLetter = asyncHandler(async (req, res) => {
  const letter = await Letter.findById(req.params.id)
    .populate('from', 'name accentColor avatar')
    .populate('to', 'name accentColor avatar');

  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  const uid = req.user._id.toString();
  const isSender = letter.from._id.toString() === uid;
  const isRecipient = letter.to._id.toString() === uid;
  if (!isSender && !isRecipient) return res.status(403).json({ message: 'Not your letter' });

  if (isRecipient && !letter.readAt) {
    letter.readAt = new Date();
    await letter.save();
  }

  res.json({ letter });
});

// DELETE /api/letters/:id
export const deleteLetter = asyncHandler(async (req, res) => {
  const letter = await Letter.findById(req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  const uid = req.user._id.toString();
  const isSender = letter.from.toString() === uid;
  const isRecipient = letter.to.toString() === uid;
  if (!isSender && !isRecipient) return res.status(403).json({ message: 'Not your letter' });

  if (isSender) letter.deletedBySender = true;
  if (isRecipient) letter.deletedByRecipient = true;

  if (letter.deletedBySender && letter.deletedByRecipient) {
    await letter.deleteOne();
  } else {
    await letter.save();
  }

  res.json({ message: 'Deleted' });
});
