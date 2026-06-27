import { Router } from 'express';
import { getStreak, checkIn, restoreStreak } from '../controllers/streakController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireCouple);

router.get('/', getStreak);
router.post('/checkin', checkIn);
router.post('/restore', restoreStreak);

export default router;
