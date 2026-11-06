import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { aiLimiter } from '../../middlewares/rate-limit';
import { sendMessage, getHistory, clearHistory } from './chat.service';

const chatBody = z.object({ message: z.string().trim().min(1).max(2000) });

export const chatRouter = Router();

chatRouter.post('/chat', aiLimiter(30), validate({ body: chatBody }), async (req, res) => {
  res.json(await sendMessage(req.user, req.validated.body.message));
});

chatRouter.get('/chat/history', async (req, res) => {
  res.json(await getHistory(req.user.id));
});

chatRouter.delete('/chat/history', async (req, res) => {
  res.json(await clearHistory(req.user.id));
});
