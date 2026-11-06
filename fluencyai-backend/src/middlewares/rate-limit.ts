import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

const byUser = (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? '');
const base = { standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas requisições. Tente novamente mais tarde.' } };

export const globalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });

// Rotas que consomem APIs de IA pagas (aplicar depois de requireAuth)
export const aiLimiter = (limit: number, windowMs = 60 * 1000) =>
  rateLimit({ ...base, windowMs, limit, keyGenerator: byUser });
