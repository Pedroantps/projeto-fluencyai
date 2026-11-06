# Deploy: Vercel (frontend) + Render (backend) + Supabase (Postgres)

Arquitetura:

- **Frontend** (`fluencyai-frontend`, Next.js 16): Vercel.
- **Backend** (`fluencyai-backend`, Express + Prisma + TTS Kokoro): Render (ou Railway/Fly). Precisa de processo sempre ligado e de RAM para o modelo de voz, por isso não vai para Functions.
- **Banco**: Supabase, usado **somente como Postgres**. A autenticação continua no **Firebase Auth**. Não há nada de Supabase Auth ou Storage no código.

Ordem: Supabase → migrations → backend → frontend → ajustes cruzados (CORS e domínios autorizados) → teste de fumaça.

---

## 1. Supabase (banco)

1. Crie o projeto (região `sa-east-1` se os usuários estão no Brasil).
2. Em **Project Settings → Database → Connection string**, copie a URL do **Session pooler** (porta `5432`, host `*.pooler.supabase.com`).
   - Use o Session pooler tanto no backend quanto nas migrations. A conexão direta pode ser só IPv6, e o Render não garante IPv6 de saída.
   - Inclua `?sslmode=require` na URL.
3. Aplique as migrations a partir da sua máquina (ou do shell do Render):

   ```bash
   cd fluencyai-backend
   DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require" npm run db:deploy
   ```

   São 7 migrations em `prisma/migrations`, aplicadas em ordem.
4. **Segurança (recomendado):** a API pública do Supabase expõe o schema `public`. O app não usa essa API, então ative **RLS** em todas as tabelas (`User`, `Message`, `Correction`, `Flashcard`, `KanbanTask`, `WordBank`, `_prisma_migrations`) sem criar policies. Depois confirme que o backend continua funcionando, porque ele conecta como `postgres`.

---

## 2. Backend (Render)

Crie um **Web Service** apontando para o repositório.

| Campo | Valor |
|---|---|
| Root Directory | `fluencyai-backend` |
| Runtime | Node 22 |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Pre-Deploy Command | `npm run db:deploy` |
| Health Check Path | `/health` |
| Plano | mínimo 1 GB de RAM (o Kokoro roda em CPU e baixa o modelo no boot) |

**Variáveis de ambiente** (todas as obrigatórias são validadas em `src/config/env.ts`; sem elas o processo encerra):

| Variável | Obrigatória | Valor |
|---|---|---|
| `NODE_ENV` | sim | `production` |
| `DATABASE_URL` | sim | URL do Session pooler do Supabase (passo 1) |
| `GEMINI_API_KEY` | sim | chave do Gemini |
| `GROQ_API_KEY` | sim | chave do Groq |
| `FIREBASE_PROJECT_ID` | sim | ID do projeto Firebase (só isso; a verificação de token não usa chave privada) |
| `CORS_ORIGINS` | sim | domínio da Vercel, ex.: `https://fluencyai.vercel.app` (vários separados por vírgula) |
| `CHAT_MODEL` | não | padrão `openai/gpt-oss-120b` |
| `TTS_VOICE` | não | padrão `af_heart` |

`PORT` é injetada pelo Render. Não defina `GEMINI_API_KEY` etc. no repositório.

Depois do primeiro deploy, teste `https://<seu-backend>.onrender.com/health`. Deve responder `{"status":"ok"}`.

---

## 3. Frontend (Vercel)

1. **Add New → Project**, importe o repositório e defina **Root Directory = `fluencyai-frontend`**. O framework Next.js é detectado sozinho.
2. Em **Environment Variables**, cadastre antes do primeiro build:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | URL do backend no Render (sem barra no final) |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | do app Web no Firebase |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | do app Web no Firebase |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | do app Web no Firebase |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | do app Web no Firebase |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | do app Web no Firebase |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | do app Web no Firebase |

   Variáveis `NEXT_PUBLIC_*` são gravadas no bundle **no momento do build**. Se mudar alguma, faça redeploy. A CSP (`next.config.mjs`) também usa `NEXT_PUBLIC_API_URL`, então a URL precisa estar certa no build.

---

## 4. Ajustes cruzados (obrigatórios)

- **Firebase → Authentication → Settings → Authorized domains:** adicione o domínio da Vercel (ex.: `fluencyai.vercel.app`). Sem isso, o login com Google falha.
- **Render → `CORS_ORIGINS`:** confirme que é exatamente a origem da Vercel (com `https://`, sem barra final).

---

## 5. Teste de fumaça

1. `GET <backend>/health` → `{"status":"ok"}`.
2. Abra o site na Vercel, faça login com Google.
3. Envie uma mensagem no chat (chama Groq/Gemini e grava no Supabase).
4. Gere um áudio de voz (confirma o Kokoro carregado no boot; veja os logs do Render).
5. Confira no Supabase (Table Editor) se a mensagem apareceu na tabela `Message`.

Se a voz falhar com timeout no primeiro acesso, é o download do modelo no boot. Aguarde o log "Kokoro TTS pronto".

---

## Pontos de atenção

- **Branch:** o Kokoro e algumas mudanças de `env.ts` estão **não commitados** no checkout de trabalho. Faça commit antes de apontar o Render para o branch, ou o deploy vai rodar código diferente do que você testou.
- **Rate limit:** o `trust proxy` (`src/app.ts`) é necessário atrás do proxy do Render. Sem ele, o limite global de 300 req/15 min vale para o app inteiro.
- **CI:** o job de frontend no `.github/workflows/ci.yml` não passa variáveis do Firebase. Se o `firebase.auth()` falhar no build sem a config, adicione as variáveis como secrets do GitHub.
