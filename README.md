# FluencyAI

App para estudar inglês com uma professora virtual. Você diz seu nível e quanto tempo tem por dia, e a IA monta o cronograma, conversa com você e transforma as palavras novas em flashcards.

Demo: https://fluencyai-br.vercel.app/

## O que o app faz

- **Chat com a Ana:** conversa em inglês por texto ou áudio. O áudio é transcrito com Whisper (via Groq) e a Ana responde em texto e voz. Palavras desconhecidas podem ser salvas no banco de palavras.
- **Cronograma semanal:** você define a meta diária (30 minutos, por exemplo) e a IA distribui gramática, vocabulário e conversação na semana. As tarefas se movem por arrastar e soltar.
- **Flashcards:** as palavras salvas viram cartões gerados pela IA, com revisão espaçada.
- **Erros:** uma página para rever os erros que você cometeu nas conversas.
- **Progresso:** tempo de estudo, sequência de dias e desempenho por habilidade.
- **Perfil:** nível (A1 a C2), meta diária, notificações e efeitos sonoros.

## Tecnologias

- **Front-end:** Next.js, Tailwind CSS, Firebase Authentication, dnd-kit, Recharts
- **Back-end:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **IA:** Gemini para cronogramas e flashcards (respostas em JSON com schema), Groq para chat e transcrição, Azure Speech ou Kokoro (local) para a voz

## Rodando localmente

Você precisa de Node 18 ou superior, um PostgreSQL (local, Supabase, Neon...), chaves do Gemini e do Groq e um projeto no Firebase.

```bash
git clone https://github.com/Pedroantps/Projeto_FluencyAI.git
cd Projeto_FluencyAI
```

### Back-end

```bash
cd fluencyai-backend
npm install
cp .env.example .env
```

Preencha o `.env`. O mínimo para subir:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fluencyai"
GEMINI_API_KEY="..."
GROQ_API_KEY="..."
FIREBASE_PROJECT_ID="mesmo_id_do_front"
CORS_ORIGINS="http://localhost:3000"
```

A voz usa o Azure se `AZURE_SPEECH_KEY` estiver definida. Sem ela, cai no Kokoro local, que baixa cerca de 90 MB na primeira vez. As outras variáveis estão comentadas no `.env.example`.

```bash
npx prisma migrate dev
npm run dev
```

O servidor sobe em `http://localhost:3333`. Para rodar a versão compilada, use `npm run build` e `npm start`. Os testes rodam com `npm test`.

### Front-end

Em outro terminal:

```bash
cd fluencyai-frontend
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com a URL da API e as chaves web do Firebase (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_*`).

```bash
npm run dev
```

O app abre em `http://localhost:3000`.

## Autor

Pedro Antônio Pereira da Silva, estudante de Engenharia de Software e desenvolvedor full-stack.

[LinkedIn](https://www.linkedin.com/in/pedro-antônio-pereira-da-silva-8a45272b7) · [GitHub](https://github.com/Pedroantps)
