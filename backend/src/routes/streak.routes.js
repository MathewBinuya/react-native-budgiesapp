import { Router } from 'express';
import { getStreak, checkIn } from '../controllers/streakController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireCouple);

router.get('/', getStreak);
router.post('/checkin', checkIn);

export default router;