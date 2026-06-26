import JournalEntry from '../models/journal.model.js';
import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { notifyPartner } from './notificationController.js';

const PROMPTS = [
  'What made you smile today?',
  "What's one thing you appreciate about each other right now?",
  'Describe a small moment from today you want to remember.',
  'What are you looking forward to together?',
  'What song reminds you of us?',
  "What's something kind your partner did recently?",
  'If we could be anywhere together right now, where would it be?',
  'What is one tiny thing that made today better?',
  'What are you grateful for today?',
  'A memory that always makes you laugh?',
];

export const getPrompt = asyncHandler(async (req, res) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  res.json({ prompt: PROMPTS[dayOfYear % PROMPTS.length] });
});

// GET /api/journal?author=me|partner
// Journals are personal — no couple required.
// ?author=partner requires a paired couple.
export const listEntries = asyncHandler(async (req, res) => {
  const which = req.query.author || 'me';

  if (which === 'partner') {
    if (!req.user.couple) return res.json({ entries: [] });
    const couple = await Couple.findById(req.user.couple);
    if (!couple) return res.json({ entries: [] });
    const partnerId = couple.members.find(
      (m) => m.toString() !== req.user._id.toString()
    );
    if (!partnerId) return res.json({ entries: [] });

    const entries = await JournalEntry.find({ author: partnerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'name accentColor');
    return res.json({ entries });
  }

  // author=me — query only by author (no couple required)
  const entries = await JournalEntry.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('author', 'name accentColor');

  res.json({ entries });
});

// POST /api/journal   body: { text }
// Personal journal — no couple required.
export const createEntry = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });

  const entry = await JournalEntry.create({
    couple: req.user.couple || null,
    author: req.user._id,
    text: text.trim(),
  });
  await entry.populate('author', 'name accentColor');

  // Notify partner (non-blocking, no-op if not paired)
  if (req.user.couple) {
    const couple = await Couple.findById(req.user.couple);
    notifyPartner(couple, req.user._id, 'journal_written');
  }

  res.status(201).json({ entry });
});

// DELETE /api/journal/:id  (author only — no couple required)
export const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findOne({
    _id: req.params.id,
    author: req.user._id,
  });
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  await entry.deleteOne();
  res.json({ message: 'Deleted' });
});
