import JournalEntry from '../models/journal.model.js';
import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

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
// Each partner has their own diary. ?author=me returns yours, =partner theirs.
export const listEntries = asyncHandler(async (req, res) => {
  const which = req.query.author || 'me';

  let authorId = req.user._id;
  if (which === 'partner') {
    // find the other member of the couple
    const couple = await Couple.findById(req.user.couple);
    if (!couple) return res.status(404).json({ message: 'Couple not found' });
    const partner = couple.members.find(
      (m) => m.toString() !== req.user._id.toString()
    );
    if (!partner) {
      // no partner yet → empty journal
      return res.json({ entries: [] });
    }
    authorId = partner;
  }

  const entries = await JournalEntry.find({
    couple: req.user.couple,
    author: authorId,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('author', 'name accentColor');

  res.json({ entries });
});

// POST /api/journal   body: { text }
// Always writes to the current user's own journal.
export const createEntry = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });

  const entry = await JournalEntry.create({
    couple: req.user.couple,
    author: req.user._id,
    text: text.trim(),
  });
  await entry.populate('author', 'name accentColor');
  res.status(201).json({ entry });
});

// DELETE /api/journal/:id  (author only)
export const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findOne({
    _id: req.params.id,
    couple: req.user.couple,
  });
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  if (entry.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own entries' });
  }
  await entry.deleteOne();
  res.json({ message: 'Deleted' });
});