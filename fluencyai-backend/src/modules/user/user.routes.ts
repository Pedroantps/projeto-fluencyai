import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { getProfile, updatePreferences } from './user.service';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const preferencesBody = z.object({
  level: z.enum(LEVELS).optional(),
  studyTime: z.coerce.number().int().min(10).max(180).optional(),
});

export const userRouter = Router();

// Perfil do usuário autenticado + estatísticas do dashboard
// (o usuário é criado/vinculado no middleware requireAuth)
userRouter.get('/me', async (req, res) => {
  res.json(await getProfile(req.user.id));
});

userRouter.patch('/user/preferences', validate({ body: preferencesBody }), async (req, res) => {
  res.json(await updatePreferences(req.user.id, req.validated.body));
});
