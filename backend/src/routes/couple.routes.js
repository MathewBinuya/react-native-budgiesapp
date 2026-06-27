import { Router } from 'express';
import {
  createCouple,
  joinCouple,
  getCouple,
  leaveCouple,
  dissolveCouple,
  updateCouple,
  regenerateCode
} from '../controllers/coupleController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect); // every route below requires a valid JWT

router.post('/create', createCouple);
router.post('/join', joinCouple);
router.post('/leave', leaveCouple);         // soft leave (testing / solo reset)
router.delete('/leave', dissolveCouple);    // hard dissolution — deletes all shared data
router.get('/', requireCouple, getCouple);
router.patch('/', requireCouple, updateCouple);
router.post('/regenerate', regenerateCode);

export default router;