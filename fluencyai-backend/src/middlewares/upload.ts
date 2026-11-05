import multer from 'multer';
import { AppError } from '../lib/errors';

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm'
      ? cb(null, true)
      : cb(new AppError(400, 'Apenas arquivos de áudio são aceitos.')),
});
