import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { prisma } from '../../lib/prisma';
import { aiLimiter } from '../../middlewares/rate-limit';
import { lookupWord } from './lookup';

const saveBody = z.object({
  word: z.string().trim().min(1).max(100),
  context: z.string().trim().max(500).optional(),
});

const lookupBody = z.object({
  word: z.string().trim().min(1).max(60).regex(/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/),
  context: z.string().trim().max(500).optional(),
});

export const wordsRouter = Router();

// Guarda uma palavra no banco de vocabulário do usuário para virar flashcard depois
wordsRouter.post('/words/save', validate({ body: saveBody }), async (req, res) => {
  const { word, context } = req.validated.body;
  const saved = await prisma.wordBank.create({ data: { word, context, userId: req.user.id } });
  res.json(saved);
});

// Tradução rápida de uma palavra (tap-to-translate) via IA
wordsRouter.post('/words/lookup', aiLimiter(30), validate({ body: lookupBody }), async (req, res) => {
  const { word, context } = req.validated.body;
  res.json(await lookupWord(word, context));
});
