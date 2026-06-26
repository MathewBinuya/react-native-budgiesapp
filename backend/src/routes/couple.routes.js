import { Router } from 'express';
import {
  createCouple,
  joinCouple,
  getCouple,
  leaveCouple,
  updateCouple,
  regenerateCode
} from '../controllers/coupleController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.post('/create', createCouple);
router.post('/join', joinCouple);
router.post("/leave", leaveCouple);
router.get('/', requireCouple, getCouple);
router.patch('/', requireCouple, updateCouple);
router.post("/regenerate", regenerateCode); // regenerate code

export default router;