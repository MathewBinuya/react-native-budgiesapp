import express from 'express';
import { protect, requireCouple } from '../middleware/auth.middleware.js';
import {
  sendLetter, getInbox, getSent, getUnreadCount, getLetter, deleteLetter,
} from '../controllers/letterController.js';

const router = express.Router();
router.use(protect, requireCouple);

router.post('/', sendLetter);
router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.get('/unread-count', getUnreadCount);
router.get('/:id', getLetter);
router.delete('/:id', deleteLetter);

export default router;
