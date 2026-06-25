import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { todayStr, yesterdayStr } from '../utils/helpers.js'

export const getStreak = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });
  res.json({ streak: serializeStreak(couple.streak, req.user._id) });
});

export const checkIn = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const s = couple.streak;
  const today = todayStr();
  const uid = req.user._id.toString();

  if (s.lastCheckIn !== today) {
    s.checkedInToday = [];
  }

  const already = s.checkedInToday.some((id) => id.toString() === uid);
  if (!already) s.checkedInToday.push(req.user._id);

  const bothIn = s.checkedInToday.length >= 2;
  if (bothIn && s.lastCheckIn !== today) {
    s.count = s.lastCheckIn === yesterdayStr() ? s.count + 1 : 1;
    s.lastCheckIn = today;
  }

  couple.markModified('streak');
  await couple.save();
  res.json({ streak: serializeStreak(s, req.user._id) });
});

function serializeStreak(s, userId) {
  const today = todayStr();
  const uid = userId.toString();
  const youCheckedIn =
    s.lastCheckIn === today ||
    (s.checkedInToday || []).some((id) => id.toString() === uid);
  return {
    count: s.count,
    lastCheckIn: s.lastCheckIn,
    checkedInTodayCount: (s.checkedInToday || []).length,
    completedToday: s.lastCheckIn === today,
    youCheckedInToday: youCheckedIn,
  };
}