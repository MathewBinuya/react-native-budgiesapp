import { Router } from 'express';
import {
  listEntries,
  createEntry,
  deleteEntry,
  getPrompt,
} from '../controllers/journalController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
// Journals are personal — only auth required, no couple needed.
router.use(protect);

router.get('/prompt', getPrompt);
router.get('/', listEntries);
router.post('/', createEntry);
router.delete('/:id', deleteEntry);

export default router;
