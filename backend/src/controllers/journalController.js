import JournalEntry from '../models/journal.model.js';
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

export const listEntries = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const query = { couple: req.user.couple };
  if (req.query.before) {
    query.createdAt = { $lt: new Date(req.query.before) };
  }
  const entries = await JournalEntry.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'name accentColor avatar');
  res.json({ entries });
});

export const createEntry = asyncHandler(async (req, res) => {
  const { text, prompt } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Text is required' });

  const entry = await JournalEntry.create({
    couple: req.user.couple,
    author: req.user._id,
    text: text.trim(),
    prompt: prompt || null,
  });
  await entry.populate('author', 'name accentColor avatar');
  res.status(201).json({ entry });
});

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