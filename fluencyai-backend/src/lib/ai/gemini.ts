import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ZodType } from 'zod';
import { env } from '../../config/env';
import { AppError } from '../errors';
import { logger } from '../logger';

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Gera JSON com o Gemini e valida a saída com zod antes de qualquer uso/persistência.
export async function generateJson<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  try {
    const result = await model.generateContent(prompt);
    return schema.parse(JSON.parse(result.response.text()));
  } catch (err) {
    logger.error({ err }, 'Falha ao gerar JSON com o Gemini');
    throw new AppError(502, 'Falha ao gerar conteúdo com a IA. Tente novamente.');
  }
}

// Remove quebras/aspas de dados do usuário usados em prompts e limita o tamanho.
export const sanitizeForPrompt = (s: string, max = 200) => s.replace(/[\r\n"`]/g, ' ').slice(0, max);
