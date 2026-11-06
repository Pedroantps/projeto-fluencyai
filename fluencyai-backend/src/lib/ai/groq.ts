import Groq, { toFile } from 'groq-sdk';
import { env } from '../../config/env';

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
