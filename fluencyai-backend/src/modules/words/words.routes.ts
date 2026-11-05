import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { prisma } from '../../lib/prisma';

const saveBody = z.object({
  word: z.string().trim().min(1).max(100),
  context: z.string().trim().max(500).optional(),
});

export const wordsRouter = Router();

// Guarda uma palavra no banco de vocabulário do usuário para virar flashcard depois
wordsRouter.post('/words/save', validate({ body: saveBody }), async (req, res) => {
  const { word, context } = req.validated.body;
  const saved = await prisma.wordBank.create({ data: { word, context, userId: req.user.id } });
  res.json(saved);
});
