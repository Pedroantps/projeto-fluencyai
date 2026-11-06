import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { createClozeCards, listErrors } from './errors.service';

const clozeBody = z.object({ ids: z.array(z.string().uuid()).min(1).max(20).optional() }).strict();

export const errorsRouter = Router();

errorsRouter.get('/errors', async (req, res) => {
  res.json(await listErrors(req.user.id));
});

errorsRouter.post('/errors/flashcards', validate({ body: clozeBody }), async (req, res) => {
  res.json(await createClozeCards(req.user.id, req.validated.body.ids));
});
