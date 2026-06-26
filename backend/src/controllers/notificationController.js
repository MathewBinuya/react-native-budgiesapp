import Notification from '../models/notification.model.js';
import Couple from '../models/couple.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// GET /api/notifications — last 50 for this user
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', 'name accentColor');

  res.json({ notifications });
});

// GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });
  res.json({ count });
});

// POST /api/notifications/read — mark all as read
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );
  res.json({ message: 'All marked as read' });
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  res.json({ message: 'Deleted' });
});

// ── Internal helper ────────────────────────────────────────────────────────────
// Call this from other controllers to create a notification for the partner.
// Non-blocking: errors are swallowed so the main action always succeeds.
export async function notifyPartner(couple, actorId, type, meta = {}) {
  try {
    if (!couple) return;
    if (couple.members.length < 2) return;

    const recipientId = couple.members.find(
      (m) => m.toString() !== actorId.toString()
    );
    if (!recipientId) return;

    await Notification.create({
      recipient: recipientId,
      couple: couple._id,
      actor: actorId,
      type,
      meta,
    });
  } catch {
    // Never fail the calling action
  }
}
