import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/read', markAllRead);
router.delete('/:id', deleteNotification);

export default router;
