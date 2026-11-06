import { env } from '../../config/env';
import { logger } from '../logger';
import * as azure from './azure-tts';
import * as kokoro from './kokoro-tts';

export type SpeechAudio = { audio: Buffer; contentType: string };

// "auto": usa Azure se a chave estiver configurada, senão Kokoro (local).
export const ttsProvider: 'azure' | 'kokoro' =
  env.TTS_PROVIDER === 'auto' ? (azure.isAzureConfigured() ? 'azure' : 'kokoro') : env.TTS_PROVIDER;

export function warmupTts() {
  logger.info(`TTS: ${ttsProvider}`);
  if (ttsProvider === 'kokoro') kokoro.warmupTts();
}

async function withKokoro(text: string): Promise<SpeechAudio> {
  return { audio: await kokoro.synthesize(text), contentType: 'audio/wav' };
}

export async function synthesize(text: string): Promise<SpeechAudio> {
  if (ttsProvider === 'kokoro') return withKokoro(text);
  try {
    return { audio: await azure.synthesize(text), contentType: 'audio/mpeg' };
  } catch (err) {
    if (!env.TTS_FALLBACK_KOKORO) throw err;
    logger.warn({ err }, 'Azure TTS falhou, usando Kokoro');
    return withKokoro(text);
  }
}
