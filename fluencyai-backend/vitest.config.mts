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
      FIREBASE_PROJECT_ID: 'test',
      CORS_ORIGINS: 'http://localhost:3000',
    },
  },
});
