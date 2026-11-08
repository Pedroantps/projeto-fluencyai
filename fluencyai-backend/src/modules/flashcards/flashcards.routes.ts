import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam } from '../../middlewares/validate';
import { aiLimiter } from '../../middlewares/rate-limit';
import { generateBatch, getDueCards, reviewCard } from './flashcards.service';
import type { Quality } from './srs';

const reviewBody = z.object({
  quality: z.number().int().min(0).max(2),
  mode: z.enum(['normal', 'dictation']).default('normal'),
});

export const flashcardsRouter = Router();

flashcardsRouter.post('/flashcards/generate-batch', aiLimiter(10, 60 * 60 * 1000), async (req, res) => {
  res.json(await generateBatch(req.user));
});

flashcardsRouter.get('/flashcards/due', async (req, res) => {
  res.json(await getDueCards(req.user.id));
});

flashcardsRouter.patch(
  '/flashcards/:id/review',
  validate({ params: idParam, body: reviewBody }),
  async (req, res) => {
    const { quality, mode } = req.validated.body;
    res.json(await reviewCard(req.user.id, req.validated.params.id, quality as Quality, mode));
  },
);
