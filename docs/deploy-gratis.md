# Roteiro de deploy 100% gratuito

Stack: **Vercel** (frontend) + **Render Free** (backend) + **Supabase Free** (Postgres) + **Firebase Auth** (login) + **Azure Speech F0** (voz) + **Groq/Gemini** (IA, planos grátis).

Custo total: R$ 0. Nenhum item exige cartão de crédito, exceto a conta Azure (veja o passo 4).

> Este roteiro substitui o plano pago de `docs/deploy.md` para o caso grátis. A diferença principal: o plano Free do Render tem 512 MB de RAM, pouco para o Kokoro local. Por isso a voz usa **somente Azure** e o Kokoro fica desligado.

Ordem: repositório → Supabase → Firebase → chaves de IA → Azure → Render → Vercel → ajustes cruzados → teste → anti-sono.

---

## 0. Pré-requisito: código no GitHub

1. Confirme que a `main` do GitHub tem a versão mais recente (`git push origin main`).
2. Renomeie o repositório se quiser, mas ele precisa estar acessível para Render e Vercel (público, ou privado com a integração do GitHub autorizada).

---

## 1. Supabase (banco Postgres, grátis)

1. https://supabase.com → **New project**. Região `South America (São Paulo)`. Guarde a senha do banco.
2. **Project Settings → Database → Connection string → Session pooler** (porta `5432`, host `*.pooler.supabase.com`). Monte a URL final:

   ```
   postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

   Use o **Session pooler**, não a conexão direta: a direta pode ser só IPv6 e o Render não garante IPv6.
3. Aplique as 9 migrations da sua máquina:

   ```bash
   cd fluencyai-backend
   npm ci
   DATABASE_URL="<url acima>" npm run db:deploy
   ```

4. Segurança: em **Table Editor**, ative **RLS** em todas as tabelas sem criar policies. O backend conecta como `postgres` e continua funcionando; a API pública do Supabase fica bloqueada.
5. Limite do plano grátis: o projeto pausa após 7 dias sem atividade. Acessar o app uma vez por semana (ou o ping do passo 10) evita isso.

---

## 2. Firebase (login com Google, grátis)

1. https://console.firebase.google.com → seu projeto atual (ou crie um).
2. **Authentication → Sign-in method → Google → Ativar**.
3. **Project settings → Your apps → Web app**: copie os 6 valores `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Eles vão para a Vercel (passo 7).
4. O `projectId` também vai para o Render como `FIREBASE_PROJECT_ID`.
5. O domínio da Vercel será autorizado no passo 8.

---

## 3. Chaves de IA (grátis)

| Serviço | Onde | Variável |
|---|---|---|
| Groq | https://console.groq.com/keys | `GROQ_API_KEY` |
| Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |

Ambos têm cota grátis com limite de requisições por minuto. Para um app pessoal ou beta fechado, basta.

---

## 4. Voz: Azure Speech F0 (grátis)

O Kokoro não cabe nos 512 MB do Render Free, então a voz roda no Azure.

1. https://portal.azure.com → **Create a resource → Speech**.
2. Pricing tier: **Free F0** (500 mil caracteres por mês). Região: `canadacentral` (ou a que preferir).
3. Em **Keys and Endpoint**, copie `KEY 1` e a região → `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION`.
4. A Azure pede cartão para verificar a conta, mas o tier F0 não cobra. Se não quiser dar cartão, deixe a voz desligada: o app funciona sem áudio, e o chat e os cartões seguem normais (veja a nota no fim).

---

## 5. Render Free (backend)

1. https://render.com → **New → Web Service** → conecte o repositório, branch `main`.
2. Campos:

   | Campo | Valor |
   |---|---|
   | Root Directory | `fluencyai-backend` |
   | Runtime | Node |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/health` |
   | Instance Type | **Free** |

   O `--include=dev` é obrigatório: o Render define `NODE_ENV=production`, o `npm ci` pularia os `@types/*` e o `tsc` falharia.

   O campo **Pre-Deploy Command** não existe no plano Free. As migrations já foram aplicadas no passo 1. Quando criar uma migration nova, rode `npm run db:deploy` da sua máquina antes de subir o código.
3. Em **Environment**, cadastre:

   | Variável | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22` |
   | `DATABASE_URL` | URL do Session pooler (passo 1) |
   | `GROQ_API_KEY` | passo 3 |
   | `GEMINI_API_KEY` | passo 3 |
   | `FIREBASE_PROJECT_ID` | passo 2 |
   | `TTS_PROVIDER` | `azure` |
   | `AZURE_SPEECH_KEY` | passo 4 |
   | `AZURE_SPEECH_REGION` | passo 4 |
   | `TTS_FALLBACK_KOKORO` | `false` |
   | `CORS_ORIGINS` | deixe provisório `http://localhost:3000`; ajuste no passo 8 |

4. **Create Web Service**. Quando terminar, abra `https://<nome>.onrender.com/health`. Deve responder `{"status":"ok"}`.
5. Guarde a URL do serviço.

Limites do Free: o serviço dorme após 15 min sem tráfego e a primeira requisição depois disso leva uns 30 a 60 segundos. O passo 10 resolve isso.

---

## 6. Vercel (frontend)

1. https://vercel.com → **Add New → Project** → importe o repositório.
2. **Root Directory = `fluencyai-frontend`**. O framework Next.js é detectado sozinho.
3. Antes do primeiro deploy, em **Environment Variables**:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | URL do Render, sem barra no final |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | passo 2 |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | passo 2 |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | passo 2 |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | passo 2 |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | passo 2 |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | passo 2 |

4. **Deploy**. Anote o domínio, por exemplo `https://fluencyai.vercel.app`.

Variáveis `NEXT_PUBLIC_*` entram no bundle **no build**. Se mudar alguma, faça **Redeploy**. A CSP em `next.config.mjs` também usa `NEXT_PUBLIC_API_URL`.

Nota: o plano Hobby da Vercel é para uso pessoal e não comercial.

---

## 7. Ajustes cruzados (obrigatórios)

1. **Firebase → Authentication → Settings → Authorized domains**: adicione `fluencyai.vercel.app` (seu domínio real). Sem isso o login com Google falha.
2. **Render → Environment → `CORS_ORIGINS`**: troque pelo domínio exato da Vercel, com `https://` e sem barra final. O Render reinicia sozinho.
3. Se a Vercel gerar URLs de preview, elas não estarão em `CORS_ORIGINS`. Para testar previews, adicione-as separadas por vírgula ou use só o domínio de produção.

---

## 8. Teste de fumaça

1. `GET <backend>/health` → `{"status":"ok"}` (pode demorar no primeiro acesso).
2. Abra o site da Vercel e entre com Google.
3. Envie uma mensagem no chat com a Ana.
4. Toque numa palavra da resposta e confira a tradução e o áudio.
5. Crie um cartão em **Meus erros** e revise um flashcard.
6. No Supabase (**Table Editor**), confira se a mensagem apareceu na tabela `Message`.
7. Abra o cronograma e confira que os vídeos abrem a busca no YouTube.

Se algo falhar, veja **Logs** no Render e o console do navegador (erros de CORS aparecem lá).

---

## 9. Deploy automático

- **Vercel e Render** refazem o deploy a cada `git push` na `main`.
- O CI (`.github/workflows/ci.yml`) roda typecheck, testes e build. Se o build do frontend falhar por falta de config do Firebase, adicione as variáveis `NEXT_PUBLIC_*` como secrets do GitHub.
- Fluxo sugerido: trabalhe em branch, abra PR (o CI roda), faça merge na `main` e o deploy acontece sozinho.

---

## 10. Anti-sono (opcional, grátis)

Para o Render não dormir e o Supabase não pausar:

1. https://uptimerobot.com → conta grátis → **Add New Monitor**.
2. Tipo `HTTP(s)`, URL `https://<backend>.onrender.com/health`, intervalo de 5 minutos.

O Render Free tem 750 horas por mês, o que cobre um serviço ligado o mês inteiro.

---

## Checklist final

- [ ] Código na `main` do GitHub
- [ ] Supabase criado, 9 migrations aplicadas, RLS ativo
- [ ] Firebase com Google ativado e 6 chaves copiadas
- [ ] Chaves Groq e Gemini
- [ ] Azure Speech F0 (ou voz desligada)
- [ ] Render no ar com `/health` ok
- [ ] Vercel no ar com as 7 variáveis
- [ ] Domínio da Vercel autorizado no Firebase
- [ ] `CORS_ORIGINS` igual ao domínio da Vercel
- [ ] Teste de fumaça completo
- [ ] Monitor no UptimeRobot

## Sem Azure (voz desligada)

`TTS_PROVIDER=azure` exige as chaves do Azure. Sem elas, o `auto` cai no Kokoro, que estoura a RAM do Free. Hoje não há opção de "sem voz" no `env.ts`, então, se não quiser usar o Azure, é preciso uma pequena mudança no código antes do deploy (aceitar `TTS_PROVIDER=none` e responder 503 no endpoint de fala). Posso fazer isso se precisar.

## Alternativas se o Render Free incomodar

| Opção | Vantagem | Desvantagem |
|---|---|---|
| Koyeb Free | não dorme | 512 MB, 1 serviço |
| Fly.io | região em São Paulo | exige cartão |
| Rodar o Kokoro | voz sem Azure | precisa de 1 GB+ de RAM (plano pago) |
