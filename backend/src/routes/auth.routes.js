import { Router } from 'express';
import { register, login, getMe, updateAccent } from '../controllers/authController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/accent', protect, updateAccent);

export default router;