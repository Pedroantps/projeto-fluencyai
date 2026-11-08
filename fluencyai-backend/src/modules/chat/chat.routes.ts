import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam } from '../../middlewares/validate';
import { aiLimiter } from '../../middlewares/rate-limit';
import {
  listSessions, createSession, deleteSession, getMessages, sendMessage, openTaskSession,
} from './chat.service';

const chatBody = z.object({ message: z.string().trim().min(1).max(2000) });
const createBody = z.object({ title: z.string().trim().max(60).optional() });
const openTaskBody = z.object({ taskId: z.string().uuid() });

export const chatRouter = Router();

chatRouter.get('/chat/sessions', async (req, res) => {
  res.json(await listSessions(req.user.id));
});

chatRouter.post('/chat/sessions', validate({ body: createBody }), async (req, res) => {
  res.json(await createSession(req.user.id, req.validated.body.title));
});

chatRouter.post('/chat/sessions/open-task', aiLimiter(30), validate({ body: openTaskBody }), async (req, res) => {
  res.json(await openTaskSession(req.user, req.validated.body.taskId));
});

chatRouter.delete('/chat/sessions/:id', validate({ params: idParam }), async (req, res) => {
  res.json(await deleteSession(req.user.id, req.validated.params.id));
});

chatRouter.get('/chat/sessions/:id/messages', validate({ params: idParam }), async (req, res) => {
  res.json(await getMessages(req.user.id, req.validated.params.id));
});

chatRouter.post(
  '/chat/sessions/:id/messages',
  aiLimiter(30),
  validate({ params: idParam, body: chatBody }),
  async (req, res) => {
    res.json(await sendMessage(req.user, req.validated.params.id, req.validated.body.message));
  },
);
