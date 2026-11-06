import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { globalLimiter } from './middlewares/rate-limit';
import { requireAuth } from './middlewares/auth';
import { errorHandler } from './middlewares/error-handler';
import { userRouter } from './modules/user/user.routes';
import { scheduleRouter } from './modules/schedule/schedule.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { flashcardsRouter } from './modules/flashcards/flashcards.routes';
import { wordsRouter } from './modules/words/words.routes';
import { speechRouter } from './modules/speech/speech.routes';

export const app = express();

// Atrás do proxy do Render/Railway/Fly: confia só no 1º hop para o IP real do cliente.
// Sem isso, o rate limit enxerga o IP do proxy e todos os usuários dividem o mesmo limite.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '100kb' }));
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Todas as rotas da API exigem um ID token válido do Firebase
app.use('/api', requireAuth, userRouter, scheduleRouter, chatRouter, flashcardsRouter, wordsRouter, speechRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});
app.use(errorHandler);
