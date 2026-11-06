import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  // Modelo de chat do Groq (modelos antigos sao descontinuados com frequencia)
  CHAT_MODEL: z.string().default('openai/gpt-oss-120b'),
  // Motor de fala: auto (Azure se houver chave, senao Kokoro), azure ou kokoro
  TTS_PROVIDER: z.enum(['auto', 'azure', 'kokoro']).default('auto'),
  // Azure AI Speech: chave e regiao do recurso (ex.: canadacentral)
  AZURE_SPEECH_KEY: z.string().optional(),
  AZURE_SPEECH_REGION: z.string().optional(),
  AZURE_SPEECH_VOICE: z.string().default('en-US-AvaMultilingualNeural'),
  // Se o Azure falhar (cota, rede), tenta o Kokoro local
  TTS_FALLBACK_KOKORO: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  // Voz do Kokoro TTS (ex.: af_heart, af_bella, am_michael)
  TTS_VOICE: z.string().default('af_heart'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  // Lista separada por virgula das origens permitidas pelo CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
}).refine((e) => e.TTS_PROVIDER !== 'azure' || (e.AZURE_SPEECH_KEY && e.AZURE_SPEECH_REGION), {
  message: 'TTS_PROVIDER=azure exige AZURE_SPEECH_KEY e AZURE_SPEECH_REGION',
  path: ['AZURE_SPEECH_KEY'],
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
};
