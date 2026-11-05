import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  AZURE_SPEECH_KEY: z.string().min(1),
  AZURE_SPEECH_REGION: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  // Lista separada por virgula das origens permitidas pelo CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error('Variaveis de ambiente invalidas ou ausentes: ' + missing);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  FIREBASE_PRIVATE_KEY: parsed.data.FIREBASE_PRIVATE_KEY.replace(/\n/g, '\n'),
};
