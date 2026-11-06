import { env } from '../../config/env';
import { logger } from '../logger';

// Kokoro-82M roda localmente (ONNX, CPU): gratuito, sem chave de API.
// O pacote é ESM-only, então é carregado com import() dinâmico.
type Kokoro = {
  generate(text: string, opts: { voice: string }): Promise<{ toWav(): ArrayBuffer }>;
};

let modelPromise: Promise<Kokoro> | null = null;

function loadModel(): Promise<Kokoro> {
  if (!modelPromise) {
    modelPromise = import('kokoro-js')
      .then(({ KokoroTTS }) =>
        KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' }),
      )
      .then((m) => m as unknown as Kokoro)
      .catch((err) => {
        modelPromise = null; // permite tentar de novo na próxima requisição
        throw err;
      });
  }
  return modelPromise;
}

// Carrega o modelo em segundo plano no boot para a primeira requisição não esperar o download.
export function warmupTts() {
  loadModel().then(
    () => logger.info('Kokoro TTS pronto'),
    (err) => logger.error({ err }, 'Falha ao carregar Kokoro TTS'),
  );
}

// A inferência usa CPU; processa uma síntese por vez para não travar o servidor.
let queue: Promise<unknown> = Promise.resolve();

export function synthesize(text: string): Promise<Buffer> {
  const job = queue.then(async () => {
    const model = await loadModel();
    const audio = await model.generate(text, { voice: env.TTS_VOICE });
    return Buffer.from(audio.toWav());
  });
  queue = job.catch(() => undefined);
  return job;
}
