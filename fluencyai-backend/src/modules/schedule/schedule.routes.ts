import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam } from '../../middlewares/validate';
import { aiLimiter } from '../../middlewares/rate-limit';
import { getSchedule, resetSchedule, updateTask } from './schedule.service';

const updateTaskBody = z
  .object({
    completed: z.boolean().optional(),
    date: z
      .string()
      .refine((d) => !Number.isNaN(Date.parse(d)), 'data inválida')
      .transform((d) => new Date(d))
      .optional(),
    order: z.number().int().min(0).max(1000).optional(),
  })
  .strict();

export const scheduleRouter = Router();

scheduleRouter.get('/schedule', aiLimiter(30), async (req, res) => {
  res.json(await getSchedule(req.user));
});

scheduleRouter.post('/schedule/reset', aiLimiter(5, 60 * 60 * 1000), async (req, res) => {
  res.json(await resetSchedule(req.user));
});

scheduleRouter.patch(
  '/schedule/task/:id',
  validate({ params: idParam, body: updateTaskBody }),
  async (req, res) => {
    res.json(await updateTask(req.user.id, req.validated.params.id, req.validated.body));
  },
);
