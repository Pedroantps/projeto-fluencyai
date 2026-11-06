import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate';
import { aiLimiter } from '../../middlewares/rate-limit';
import { audioUpload } from '../../middlewares/upload';
import { transcribe } from '../../lib/ai/groq';
import { synthesize } from '../../lib/ai/kokoro-tts';
import { badRequest } from '../../lib/errors';

const ttsBody = z.object({ text: z.string().trim().min(1).max(1000) });

export const speechRouter = Router();

// Fala -> texto (Groq Whisper). O áudio fica só em memória, sem arquivos temporários.
speechRouter.post('/transcribe', aiLimiter(10), audioUpload.single('audio'), async (req, res) => {
  if (!req.file) throw badRequest('Nenhum arquivo de áudio foi enviado.');
  res.json({ text: await transcribe(req.file.buffer) });
});

// Texto -> fala (Kokoro TTS local)
speechRouter.post('/tts', aiLimiter(30), validate({ body: ttsBody }), async (req, res) => {
  const audio = await synthesize(req.validated.body.text);
  res.setHeader('Content-Type', 'audio/wav');
  res.send(audio);
});
