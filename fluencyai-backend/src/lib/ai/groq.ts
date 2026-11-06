import Groq, { toFile } from 'groq-sdk';
import type { ZodType } from 'zod';
import { env } from '../../config/env';
import { AppError } from '../errors';
import { logger } from '../logger';

export const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function transcribe(buffer: Buffer): Promise<string> {
  const result = await groq.audio.transcriptions.create({
    file: await toFile(buffer, 'audio.webm'),
    model: 'whisper-large-v3',
    prompt: 'The audio may contain English or Portuguese speech. Please transcribe naturally with punctuation.',
    response_format: 'json',
  });
  return result.text;
}

export async function completeJson<T>(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  schema: ZodType<T>,
  temperature = 0.2,
): Promise<T> {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model: env.CHAT_MODEL,
      temperature,
      response_format: { type: 'json_object' },
    });
    const raw = (completion.choices[0]?.message?.content || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    return schema.parse(JSON.parse(raw));
  } catch (err) {
    logger.error({ err }, 'Falha ao gerar resposta do chat');
    throw new AppError(502, 'Falha na comunicação com a IA.');
  }
}
