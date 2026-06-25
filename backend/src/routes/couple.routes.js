import { Router } from 'express';
import {
  createCouple,
  joinCouple,
  getCouple,
  updateCouple,
  regenerateCode
} from '../controllers/coupleController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.post('/create', createCouple);
router.post('/join', joinCouple);
router.get('/', requireCouple, getCouple);
router.patch('/', requireCouple, updateCouple);
router.post("/regenerate", regenerateCode); // regenerate code

export default router;