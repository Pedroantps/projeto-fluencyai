import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: 'Arquivo inválido ou grande demais.' });
  }
  const type = (err as { type?: string })?.type;
  if (type === 'entity.too.large') return res.status(413).json({ error: 'Corpo da requisição grande demais.' });
  if (type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  logger.error({ err }, 'Erro não tratado');
  res.status(500).json({ error: 'Erro interno do servidor.' });
}
