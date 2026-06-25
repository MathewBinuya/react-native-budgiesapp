import { Router } from 'express';
import {
  listEntries,
  createEntry,
  deleteEntry,
  getPrompt,
} from '../controllers/journalController.js';
import { protect, requireCouple } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect, requireCouple);

router.get('/prompt', getPrompt);
router.get('/', listEntries);
router.post('/', createEntry);
router.delete('/:id', deleteEntry);

export default router;