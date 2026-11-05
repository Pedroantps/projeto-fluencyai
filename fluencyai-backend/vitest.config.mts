import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      GEMINI_API_KEY: 'test',
      GROQ_API_KEY: 'test',
      AZURE_SPEECH_KEY: 'test',
      AZURE_SPEECH_REGION: 'test',
      FIREBASE_PROJECT_ID: 'test',
      FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: 'test',
      CORS_ORIGINS: 'http://localhost:3000',
    },
  },
});
