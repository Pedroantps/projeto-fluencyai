import type { Request, Response, NextFunction } from 'express';
import { z, type ZodType } from 'zod';
import { AppError } from '../lib/errors';

interface Schemas { body?: ZodType; query?: ZodType; params?: ZodType }

// Valida body/query/params; o resultado tipado fica em req.validated (req.query é getter no Express 5)
export const validate = (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
  req.validated = {};
  for (const key of ['body', 'query', 'params'] as const) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key] ?? {});
    if (!result.success) {
      return next(new AppError(400, result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')));
    }
    req.validated[key] = result.data;
  }
  next();
};

export const idParam = z.object({ id: z.string().uuid() });
