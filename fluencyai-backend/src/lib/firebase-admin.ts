import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';

// Verificar ID tokens só exige o projectId (usa as chaves públicas do Google);
// não precisamos guardar nenhuma chave privada de service account.
if (!getApps().length) {
  initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
}

export const firebaseAuth = getAuth();
