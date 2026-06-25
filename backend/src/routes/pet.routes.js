import { Router } from 'express';
import { getPet, feedPet, playWithPet } from '../controllers/petController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireCouple);

router.get('/', getPet);
router.post('/feed', feedPet);
router.post('/play', playWithPet);

export default router;