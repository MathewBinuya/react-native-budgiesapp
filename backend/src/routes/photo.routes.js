import { Router } from 'express';
import multer from 'multer';
import {
  listPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto,
} from '../controllers/photoController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

// Keep the file in memory; we stream the buffer to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();
router.use(protect, requireCouple);

router.get('/', listPhotos);
router.post('/', upload.single('image'), uploadPhoto);
router.patch('/:id', updatePhoto);
router.delete('/:id', deletePhoto);

export default router;