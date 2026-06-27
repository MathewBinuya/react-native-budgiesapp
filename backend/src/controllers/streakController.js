import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { todayStr, yesterdayStr } from '../utils/helpers.js';
import { notifyPartner } from './notificationController.js';

export const getStreak = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });
  res.json({ streak: serializeStreak(couple.streak, req.user._id) });
});

// Called automatically when a partner opens the app (via loadCoupleData).
// Any partner opening counts the streak — no need to wait for both.
// checkedInToday still tracks WHO opened (for the "both opened" bonus display).
// Atomic ops eliminate race conditions when both open simultaneously.
export const checkIn = asyncHandler(async (req, res) => {
  const today = todayStr();

  // Step 1 — if it's a new day, atomically reset the check-in array.
  await Couple.updateOne(
    { _id: req.user.couple, 'streak.checkedInDate': { $ne: today } },
    {
      $set: {
        'streak.checkedInDate': today,
        'streak.checkedInToday': [],
      },
    }
  );

  // Step 2 — atomically add this user ($addToSet is idempotent).
  let couple = await Couple.findOneAndUpdate(
    { _id: req.user.couple },
    { $addToSet: { 'streak.checkedInToday': req.user._id } },
    { new: true }
  );

  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const s = couple.streak;

  // Step 3 — advance streak if not yet counted today.
  // First person to open wins; the $ne guard on lastCheckIn ensures
  // only one concurrent request writes even if both open simultaneously.
  if (s.lastCheckIn !== today) {
    const wasYesterday = s.lastCheckIn === yesterdayStr();
    const newCount = wasYesterday ? s.count + 1 : 1;

    const updates = {
      'streak.count': newCount,
      'streak.lastCheckIn': today,
    };

    if (!wasYesterday && s.count >= 2) {
      updates['streak.brokenCount'] = s.count;
    }
    if (newCount >= 2 && s.brokenCount > 0) {
      updates['streak.brokenCount'] = 0;
    }

    const advanced = await Couple.findOneAndUpdate(
      { _id: req.user.couple, 'streak.lastCheckIn': { $ne: today } },
      { $set: updates },
      { new: true }
    );

    if (advanced) couple = advanced;
  }

  notifyPartner(couple, req.user._id, 'check_in', {
    streakCount: couple.streak.count,
    completedToday: couple.streak.lastCheckIn === today,
  });

  res.json({ streak: serializeStreak(couple.streak, req.user._id) });
});

// POST /api/streak/restore — spend one monthly restore to recover a broken streak.
export const restoreStreak = asyncHandler(async (req, res) => {
  const couple = await Couple.findById(req.user.couple);
  if (!couple) return res.status(404).json({ message: 'Couple not found' });

  const s = couple.streak;
  const today = todayStr();
  const currentMonth = today.slice(0, 7); // "YYYY-MM"

  // Refill restores at the start of a new calendar month
  if (s.restoresMonth !== currentMonth) {
    s.restores = 3;
    s.restoresMonth = currentMonth;
  }

  if (s.restores <= 0) {
    return res.status(400).json({ message: 'No restores left this month. You get 3 per month.' });
  }
  if (!s.brokenCount || s.brokenCount < 2) {
    return res.status(400).json({ message: 'No streak to restore.' });
  }

  // Restore: set count back, put lastCheckIn = yesterday so the next
  // double open today increments from brokenCount → brokenCount + 1.
  s.count = s.brokenCount;
  s.lastCheckIn = yesterdayStr();
  s.brokenCount = 0;
  s.restores -= 1;
  s.restoresMonth = currentMonth;

  // Clear today's check-ins so both partners must open the app to confirm
  s.checkedInToday = [];
  s.checkedInDate = null;

  couple.markModified('streak');
  await couple.save();

  res.json({
    streak: serializeStreak(s, req.user._id),
    message: `Streak restored! Open the app today to keep it going.`,
  });
});

function serializeStreak(s, userId) {
  const today = todayStr();
  const currentMonth = today.slice(0, 7);
  const uid = userId.toString();

  const restores = s.restoresMonth !== currentMonth ? 3 : (s.restores ?? 3);
  const list = s.checkedInDate === today ? (s.checkedInToday || []) : [];

  const youCheckedIn = list.some((id) => id.toString() === uid);
  const partnerCheckedIn = list.some((id) => id.toString() !== uid);

  return {
    count: s.count,
    lastCheckIn: s.lastCheckIn,
    checkedInTodayCount: list.length,
    completedToday: s.lastCheckIn === today,
    youCheckedInToday: youCheckedIn,
    partnerCheckedInToday: partnerCheckedIn,
    bothOpenedToday: youCheckedIn && partnerCheckedIn,
    brokenCount: s.brokenCount || 0,
    restores,
    restoresMonth: currentMonth,
  };
}
