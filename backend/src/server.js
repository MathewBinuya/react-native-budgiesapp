import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { connectDB } from './lib/db.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

import cronJob from './lib/cron.js';
import authRoutes from './routes/auth.routes.js';
import coupleRoutes from './routes/couple.routes.js';
import petRoutes from './routes/pet.routes.js';
import journalRoutes from './routes/journal.routes.js';
import photoRoutes from './routes/photo.routes.js';
import streakRoutes from './routes/streak.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/streak', streakRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`✓ Budgies API on http://localhost:${PORT}`));
  if (process.env.API_URL) cronJob.start();
});