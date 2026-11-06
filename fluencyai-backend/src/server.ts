import { app } from './app';
import { env } from './config/env';
import { prisma, pool } from './lib/prisma';
import { logger } from './lib/logger';
import { warmupTts } from './lib/ai/kokoro-tts';

const server = app.listen(env.PORT, () => {
  logger.info(`Servidor rodando na porta ${env.PORT}`);
  warmupTts();
});

// Encerramento gracioso: para de aceitar conexões e fecha o banco
async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
