import { Router } from 'express';
import multer from 'multer';
import { register, login, getMe, updateAccent, updateAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/auth.middleware.js';

// In-memory storage: we stream the buffer straight to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max for avatars
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/accent', protect, updateAccent);
router.patch('/avatar', protect, upload.single('avatar'), updateAvatar);

export default router;
