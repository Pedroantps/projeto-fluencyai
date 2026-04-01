# FluencyAI ✨

> Uma plataforma completa e moderna de aprendizagem de inglês guiada por Inteligência Artificial, projetada para se adaptar à sua rotina.

![FluencyAI Cover](docs/assets/fluencyai.png) 

## 💻 Sobre o Projeto

O **FluencyAI** nasceu da necessidade de otimizar a aprendizagem de idiomas para quem tem uma rotina corrida. Em vez de um curso tradicional com aulas engessadas, a plataforma utiliza Inteligência Artificial generativa para criar um ecossistema de estudos 100% personalizado. O utilizador define o seu nível e tempo disponível, e a IA monta o seu cronograma, atua como sua professora particular e gera flashcards automaticamente para revisão.

## ✨ Funcionalidades Principais

- 🗣️ **Teacher Ana (Chat AI com Voz):** Uma professora nativa disponível 24/7. Suporta envio de áudio (transcrição ultra-rápida via Groq/Whisper) e respostas em texto e voz (TTS). Pode guardar palavras desconhecidas diretamente no seu *Word Bank*.
- 📅 **Cronograma Inteligente (Kanban):** Defina a sua meta diária (ex: 30 minutos) e a IA gera uma rotina semanal equilibrando Gramática, Vocabulário e Conversação. Interface interativa com *Drag and Drop*.
- 🧠 **Flashcards com Repetição Espaçada:** Transforme as palavras guardadas no chat em flashcards gerados por IA. O sistema agenda revisões com base na sua facilidade em lembrar de cada termo.
- 📊 **Dashboard de Progresso:** Acompanhe as suas estatísticas de estudo, tempo investido, ofensiva (*streak*) e métricas de desempenho divididas por competências.
- ⚙️ **Configurações de Perfil:** Personalize o seu nível de proficiência (A1 a C2), meta diária de estudos e preferências de notificação e efeitos sonoros.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma arquitetura Full-Stack moderna:

### Front-end
- **[Next.js](https://nextjs.org/)** (React)
- **[Tailwind CSS](https://tailwindcss.com/)** (Estilização e Dark Mode nativo)
- **[Firebase Authentication](https://firebase.google.com/docs/auth)** (Gestão segura de utilizadores)
- **[dnd-kit](https://dndkit.com/)** (Lógica complexa de Drag and Drop)
- **[Recharts](https://recharts.org/)** (Gráficos e visualização de dados)
- **[Lucide Icons](https://lucide.dev/)**

### Back-end & Base de Dados
- **[Node.js](https://nodejs.org/)** com **[Express](https://expressjs.com/)**
- **[TypeScript](https://www.typescriptlang.org/)** (Tipagem forte de ponta a ponta)
- **[PostgreSQL](https://www.postgresql.org/)** (Base de dados relacional)
- **[Prisma ORM](https://www.prisma.io/)** (Modelação de dados e migrações)

### Inteligência Artificial
- **Google Gemini API** (`gemini-2.5-flash`): Cérebro da plataforma, utilizando *Structured Outputs* (Schemas) para garantir retornos consistentes em formato JSON estrito para os cronogramas e flashcards.
- **Groq SDK + Whisper**: Processamento de linguagem natural e transcrição de áudio em tempo real (Speech-to-Text).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18 ou superior)
- PostgreSQL (a correr localmente ou na nuvem, ex: Neon/Supabase)
- Chaves de API: Google Gemini, Groq e credenciais do Firebase.

### 1. Clonar o Repositório
```bash
git clone [https://github.com/o-seu-usuario/projeto-fluencyai.git](https://github.com/o-seu-usuario/projeto-fluencyai.git)
cd projeto-fluencyai
```

### 2. Configurar o Back-end
```bash
cd fluencyai-backend
npm install
```
Crie um ficheiro `.env` na pasta `fluencyai-backend` e adicione as suas variáveis:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fluencyai"
GEMINI_API_KEY="sua_chave_gemini"
GROQ_API_KEY="sua_chave_groq"
```
Corra as migrações da base de dados e inicie o servidor:
```bash
npx prisma migrate dev
npm run build
npm start
```
*O servidor estará a correr em `http://localhost:3333`.*

### 3. Configurar o Front-end
Abra um novo terminal e vá para a pasta do front-end:
```bash
cd fluencyai-frontend
npm install
```
Crie um ficheiro `.env.local` na pasta `fluencyai-frontend` com as suas chaves do Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="sua_chave"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu_dominio"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu_project_id"
# ... outras variáveis do Firebase
```
Corra a aplicação:
```bash
npm run build
npm start
```
*Aceda à aplicação em `http://localhost:3000`.*

---

## 👨‍💻 Autor

**Pedro Antônio Pereira da Silva** *Estudante de Engenharia de Software e Desenvolvedor Full-Stack*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pedro-antônio-pereira-da-silva-8a45272b7)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Pedroantps)

---
Feito com dedicação e muito código! ✨