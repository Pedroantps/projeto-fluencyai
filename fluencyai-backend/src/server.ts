import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Carrega as variáveis de ambiente a partir do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Configura os middlewares globais para tratamento de requisições
app.use(cors());
app.use(express.json());

// Configura a conexão com o banco de dados PostgreSQL usando Prisma
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configura o interceptador Multer para salvar arquivos de áudio temporariamente
const upload = multer({ dest: '/tmp/' });

// Inicializa o cliente da API do Groq para geração de respostas de baixa latência
const groq = new Groq();

// Configura o cliente da Google Generative AI (Gemini) com a chave de acesso
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "SUA_API_KEY");

// Busca o cronograma semanal do usuário ou gera um novo caso não exista
app.get('/api/schedule', async (req, res) => {
  try {
    const userEmail = req.query.email as string;
    
    if (!userEmail) {
      return res.status(400).json({ error: "Email do utilizador é obrigatório." });
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: "Utilizador não encontrado." });
    }

    // Busca todas as tarefas associadas ao usuário ordenadas por data e sequência
    let tasks = await prisma.kanbanTask.findMany({
      where: { userId: user.id },
      orderBy: [{ date: 'asc' }, { order: 'asc' }]
    });

    // Gera um novo cronograma com a IA caso o banco não retorne tarefas agendadas
    if (tasks.length === 0) {
      console.log(`A gerar semana de estudos com Gemini para ${userEmail}...`);
      
      const dailyMinutes = user.studyTime || 30;

      const prompt = `
        Você é um professor de inglês a montar um cronograma semanal (7 dias) para um aluno com nível de proficiência ${user.level} (Quadro Europeu Comum de Referência).
        
        A sua principal missão é ADAPTAR a dificuldade de todas as tarefas para o nível ${dailyMinutes}. Se for A1/A2, use temas básicos (rotina, cumprimentos, verbo to be, entre outros). Se for B1/B2, temas intermediários (viagens, opiniões, present perfect, entre outros). Se for C1/C2, temas avançados (negócios, debates filosóficos, idioms complexos, entre outros).
        
        Retorne APENAS um objeto JSON com a seguinte estrutura:
        {
          "schedule": [
            {
              "day": 1,
              "tasks": [
                { "type": "video", "title": "Gramática: Present Perfect", "duration": 15, "link": "https://www.youtube.com/results?search_query=learn+present+perfect+english" },
                { "type": "flashcard", "title": "Revisar: Vocabulário de Viagem", "duration": 10 },
                { "type": "chat", "title": "Simulação: Pedir comida num restaurante", "duration": 15 }
              ]
            }
          ]
        }
        Regras ESTRITAS:
        - Gere os dados para os 7 dias completos (day 1 até day 7).
        - Cada dia DEVE ter exatamente 3 tarefas nesta ordem: 1 'video', 1 'flashcard', 1 'chat'.
        - O 'link' é obrigatório na tarefa 'video' (use links de pesquisa do YouTube reais).
        - Varie bastante os temas de gramática, vocabulário e situações de conversação ao longo dos 7 dias para que o aluno não fique aborrecido.
        - A duração total somada das 3 tarefas do dia deve ser em torno de ${dailyMinutes} minutos.
      `;

      // Solicita a estruturação de dados à IA garantindo retorno exclusivo em formato JSON
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent(prompt);
      const aiResponseText = result.response.text();

      // Converte a string JSON da IA em um objeto JavaScript manipulável
      const generatedData = JSON.parse(aiResponseText);
      const newTasksData: any[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Processa a resposta da IA preparando o array para inserção no banco de dados
      generatedData.schedule.forEach((dayPlan: any, index: number) => {
        // Associa uma data sequencial a cada dia começando a partir da data atual
        const taskDate = new Date();
        taskDate.setHours(0, 0, 0, 0);
        taskDate.setDate(taskDate.getDate() + index);

        dayPlan.tasks.forEach((task: any, taskIndex: number) => {
          newTasksData.push({
            type: task.type,
            title: task.title,
            duration: task.duration,
            link: task.link || null,
            order: taskIndex,
            date: taskDate,
            userId: user.id
          });
        });
      });

      // Persiste todas as tarefas formatadas no banco de dados em uma única transação
      await prisma.kanbanTask.createMany({ data: newTasksData });
      
      // Recupera as tarefas recém-criadas para garantir consistência de leitura
      tasks = await prisma.kanbanTask.findMany({
        where: { userId: user.id },
        orderBy: [{ date: 'asc' }, { order: 'asc' }]
      });
    }

    // Agrupa e estrutura o formato das tarefas por dia para retorno ao cliente
    const scheduleByDay: Record<string, any> = {};

    tasks.forEach(task => {
      const dateStr = task.date.toISOString().split('T')[0]; 
      
      if (!scheduleByDay[dateStr]) {
        const dayName = task.date.toLocaleDateString('pt-BR', { weekday: 'long' });
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        
        scheduleByDay[dateStr] = {
          dayName: capitalizedDayName,
          date: task.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          fullDate: dateStr, // ID único para a coluna no Drag and Drop
          tasks: []
        };
      }
      scheduleByDay[dateStr].tasks.push(task);
    });

    const formattedSchedule = Object.values(scheduleByDay).sort((a: any, b: any) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );

    res.json(formattedSchedule);

  } catch (error) {
    console.error("Erro ao procurar/gerar cronograma com Gemini:", error);
    res.status(500).json({ error: "Falha ao gerar cronograma." });
  }
});

// Apaga as tarefas existentes e força a geração de um novo cronograma completo
app.post('/api/schedule/reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email é obrigatório." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Remove todos os registros de tarefas do usuário do banco de dados
    await prisma.kanbanTask.deleteMany({
      where: { userId: user.id }
    });

    console.log(`Gerando novo cronograma limpo para ${email}...`);

    // Obtém a preferência de meta diária de estudos do usuário
    const dailyMinutes = user.studyTime || 30;

    // Monta o prompt solicitando a recriação do plano de estudos em JSON
    const prompt = `
      Você é um professor de inglês montando um cronograma semanal (7 dias) para um aluno de nível ${user.level}.
      O aluno definiu uma meta rígida de estudo: aproximadamente ${dailyMinutes} minutos por dia.
      
      Retorne APENAS um objeto JSON válido com a seguinte estrutura:
      {
        "schedule": [
          {
            "day": 1,
            "tasks": [
              { "type": "video", "title": "Gramática: Present Perfect", "duration": 15, "link": "https://www.youtube.com/results?search_query=learn+present+perfect+english" },
              { "type": "flashcard", "title": "Revisar: Vocabulário de Viagem", "duration": 10 },
              { "type": "chat", "title": "Simulação: Pedindo comida no restaurante", "duration": 15 }
            ]
          }
        ]
      }
      Regras: 
      - Crie 7 dias completos. 
      - Cada dia DEVE ter exatamente 3 tarefas nesta ordem: 1 'video', 1 'flashcard', 1 'chat'.
      - A SOMA da duração ('duration') das tarefas de um dia tem que ficar muito próxima de ${dailyMinutes} minutos!
      - O 'link' é obrigatório no tipo video.
    `;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const generatedData = JSON.parse(result.response.text());

    // Organiza as novas tarefas com datas sequenciais a partir do dia de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTasksData: any[] = [];
    generatedData.schedule.forEach((dayPlan: any, index: number) => {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + index);

      dayPlan.tasks.forEach((task: any, taskIndex: number) => {
        newTasksData.push({
          type: task.type,
          title: task.title,
          duration: task.duration,
          link: task.link || null,
          order: taskIndex,
          date: taskDate,
          userId: user.id
        });
      });
    });

    await prisma.kanbanTask.createMany({ data: newTasksData });

    // Recupera e processa os dados gerados, ajustando fusos para retorno seguro ao front-end
    const tasks = await prisma.kanbanTask.findMany({
      where: { userId: user.id },
      orderBy: [{ date: 'asc' }, { order: 'asc' }]
    });

    const scheduleByDay: Record<string, any> = {};
    tasks.forEach(task => {
      const d = new Date(task.date);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      
      if (!scheduleByDay[dateStr]) {
        scheduleByDay[dateStr] = {
          dayName: d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' }),
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
          fullDate: dateStr,
          tasks: []
        };
      }
      scheduleByDay[dateStr].tasks.push(task);
    });

    const formattedSchedule = Object.values(scheduleByDay).sort((a: any, b: any) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );

    res.json(formattedSchedule);

  } catch (error) {
    console.error("Erro ao resetar cronograma:", error);
    res.status(500).json({ error: "Falha ao resetar cronograma." });
  }
});

// Atualiza os status isolados de uma tarefa (conclusão, nova data ou ordenação)
app.patch('/api/schedule/task/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, date, order } = req.body; 

    const updatedTask = await prisma.kanbanTask.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(order !== undefined && { order })
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    res.status(500).json({ error: "Falha ao atualizar tarefa." });
  }
});

// Atualiza as configurações de preferências e metas do usuário no sistema
app.patch('/api/user/preferences', async (req, res) => {
  try {
    const { email, level, studyTime } = req.body;
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        ...(level !== undefined && { level }),
        ...(studyTime !== undefined && { studyTime: Number(studyTime) })
      }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Falha ao atualizar preferências." });
  }
});

// Processa um arquivo de áudio recebido convertendo a fala para texto usando Groq Whisper
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo de áudio foi enviado." });
    }

    // Identifica e renomeia o arquivo temporário injetando a extensão suportada
    const originalPath = req.file.path;
    const newPath = originalPath + '.webm'; 
    fs.renameSync(originalPath, newPath);

    // Envia o arquivo para a API do Groq solicitar a transcrição em texto
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(newPath), 
      model: "whisper-large-v3",
      prompt: "The audio may contain English or Portuguese speech. Please transcribe naturally with punctuation.", 
      response_format: "json",
    });

    // Exclui o arquivo temporário para gerenciamento eficiente de espaço
    fs.unlinkSync(newPath);

    // Devolve o texto final retornado pelo motor de transcrição
    res.json({ text: transcription.text });

  } catch (error) {
    console.error("Erro na transcrição Whisper:", error);
    res.status(500).json({ error: "Falha ao transcrever o áudio." });
  }
});

// Processa mensagens textuais do usuário provendo resposta em inglês e feedback de erros
app.post('/api/chat', async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!message || !email) {
      return res.status(400).json({ error: "Email e mensagem são obrigatórios." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Salva permanentemente a mensagem de entrada originada do usuário
    await prisma.message.create({
      data: { content: message, role: "USER", userId: user.id }
    });

    // Recupera o histórico de curto prazo (24h) para fornecer contexto à IA sem exceder tokens
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await prisma.message.findMany({
      where: { userId: user.id, createdAt: { gte: yesterday } },
      orderBy: { createdAt: 'asc' },
      take: 10 
    });

    // Prepara o array de mensagens mesclando regras do sistema e contexto passado
    const groqMessages: any[] = [
      {
        role: "system",
        content: `You are an expert, strict but friendly native English teacher named Ana.
        CORE RULES:
        1. ALWAYS reply in natural, fluent English to maintain the conversation flow.
        2. Analyze the user's input for ANY Portuguese words, grammar mistakes, or awkward phrasing.
        JSON RESPONSE FORMAT:
        { "reply": "...", "correction": null or { "original": "...", "corrected": "...", "explanation": "..." } }`
      },
      ...history.map(m => ({
        role: m.role.toLowerCase(),
        content: m.content
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    let aiResponseText = chatCompletion.choices[0]?.message?.content || "{}";
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedResponse = JSON.parse(aiResponseText);

    // Salva a resposta do assistente no banco atrelada à sua eventual correção
    const aiMessage = await prisma.message.create({
      data: {
        content: parsedResponse.reply || "I didn't quite catch that.",
        role: "ASSISTANT",
        userId: user.id,
        ...(parsedResponse.correction && {
          correction: {
            create: {
              original: parsedResponse.correction.original,
              corrected: parsedResponse.correction.corrected,
              explanation: parsedResponse.correction.explanation
            }
          }
        })
      },
      include: { correction: true }
    });

    res.json({
      reply: aiMessage.content,
      correction: aiMessage.correction || null
    });

  } catch (error) {
    console.error("Erro no chat:", error);
    res.status(500).json({ error: "Falha na comunicação." });
  }
});

// Consulta e retorna o histórico de conversação do usuário no intervalo das últimas 24h
app.get('/api/chat/history', async (req, res) => {
  try {
    const userEmail = req.query.email as string;
    if (!userEmail) return res.status(400).json({ error: "Email obrigatório." });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const history = await prisma.message.findMany({
      where: { userId: user.id, createdAt: { gte: yesterday } },
      include: { correction: true },
      orderBy: { createdAt: 'asc' }
    });

    const formattedHistory = history.map(m => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      correction: m.correction
    }));

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar histórico." });
  }
});

// Esvazia o histórico completo do usuário limpando o contexto para uma nova conversação
app.delete('/api/chat/history', async (req, res) => {
  try {
    const userEmail = req.query.email as string;
    if (!userEmail) return res.status(400).json({ error: "Email obrigatório." });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Deleta os registros de mensagem em cascata da base de dados
    await prisma.message.deleteMany({
      where: { userId: user.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar chat." });
  }
});

// Armazena uma palavra específica no banco vocabular do usuário para revisão futura
app.post('/api/words/save', async (req, res) => {
  try {
    const { email, word, context } = req.body;
    if (!email || !word) return res.status(400).json({ error: "Faltam dados." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const savedWord = await prisma.wordBank.create({
      data: { word, context, userId: user.id }
    });

    res.json(savedWord);
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar palavra." });
  }
});

// Fabrica um lote de flashcards analisando palavras salvas, metas de cronograma e preenchimento auxiliar
app.post('/api/flashcards/generate-batch', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Recupera uma cota de palavras marcadas recentemente no chat para prioridade no estudo
    const pendingWords = await prisma.wordBank.findMany({
      where: { userId: user.id, used: false },
      take: 4
    });

    // Busca as tarefas e metas alocadas para a data presente do sistema
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = await prisma.kanbanTask.findMany({
      where: { userId: user.id, date: today }
    });
    
    // Identifica qual é o tópico isolado da tarefa referenciada como "flashcard"
    const flashcardTask = todayTasks.find(t => t.type === 'flashcard');
    const flashcardTheme = flashcardTask ? flashcardTask.title : null;
    
    // Compila os tópicos abordados nas demais tarefas de estudo do dia
    const studyContext = todayTasks
      .filter(t => t.type !== 'flashcard')
      .map(t => t.title).join(", ");

    const wordsList = pendingWords.map(w => `"${w.word}" (Contexto: ${w.context})`).join("; ");
    
    // Solicita ao LLM um array unificado combinando as três fontes de conhecimento
    const prompt = `
      Você é um professor criando um deck de 10 flashcards para um aluno de inglês nível ${user.level}.
      
      Regras de Geração (MISTURE AS FONTES PARA ATINGIR EXATAMENTE 10 CARDS):
      ${pendingWords.length > 0 ? `- Crie cards para estas palavras que o aluno separou no chat: ${wordsList}. Marque o 'source' delas como 'chat'.` : ''}
      ${flashcardTheme ? `- Crie de 3 a 4 cards EXATAMENTE sobre este tema (meta principal de flashcards de hoje): "${flashcardTheme}". Marque o 'source' como 'cronograma'.` : ''}
      ${studyContext ? `- Crie de 2 a 3 cards baseados nos outros tópicos que ele está estudando hoje: "${studyContext}". Marque o 'source' como 'cronograma'.` : ''}
      - Preencha os cards restantes (para totalizar os 10) com vocabulário essencial, phrasal verbs ou regras úteis para o nível ${user.level}. Evite palavras muito básicas se o nível for B1 ou superior. Marque o 'source' como 'aleatorio'.

      Retorne APENAS um array JSON neste formato exato com 10 objetos:
      [
        { "front": "palavra em inglês", "back": "tradução + frase curta de exemplo em inglês", "source": "chat|cronograma|aleatorio" }
      ]
    `;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const generatedCards = JSON.parse(result.response.text());

    const cardsToInsert = generatedCards.map((card: any) => ({
      front: card.front,
      back: card.back,
      source: card.source || "aleatorio",
      userId: user.id
    }));
    
    await prisma.flashcard.createMany({ data: cardsToInsert });

    if (pendingWords.length > 0) {
      await prisma.wordBank.updateMany({
        where: { id: { in: pendingWords.map(w => w.id) } },
        data: { used: true }
      });
    }

    res.json({ message: "Deck de 10 cartões gerado com sucesso!", count: cardsToInsert.length });
  } catch (error) {
    console.error("Erro no Batch:", error);
    res.status(500).json({ error: "Falha ao gerar o deck inteligente." });
  }
});

// Identifica e retorna os flashcards pendentes cuja data de revisão atingiu ou ultrapassou o dia atual
app.get('/api/flashcards/due', async (req, res) => {
  try {
    const userEmail = req.query.email as string;
    if (!userEmail) return res.status(400).json({ error: "Email é obrigatório." });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const dueFlashcards = await prisma.flashcard.findMany({
      where: {
        userId: user.id,
        nextReviewDate: { lte: new Date() }
      },
      orderBy: { nextReviewDate: 'asc' }
    });

    res.json(dueFlashcards);
  } catch (error) {
    console.error("Erro ao buscar flashcards:", error);
    res.status(500).json({ error: "Falha ao buscar flashcards." });
  }
});

// Calcula as novas variáveis de repetição espaçada (SRS) de um flashcard após sua avaliação
app.patch('/api/flashcards/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body; 

    if (quality === undefined || quality < 0 || quality > 2) {
      return res.status(400).json({ error: "Qualidade inválida." });
    }

    const card = await prisma.flashcard.findUnique({ where: { id } });
    if (!card) return res.status(404).json({ error: "Flashcard não encontrado." });

    let { interval, easeFactor } = card;

    if (quality === 0) { 
      interval = 0; 
      easeFactor = Math.max(1.3, easeFactor - 0.2); 
    } else if (quality === 1) { 
      interval = interval === 0 ? 1 : Math.round(interval * easeFactor);
    } else if (quality === 2) { 
      interval = interval === 0 ? 4 : Math.round(interval * easeFactor * 1.3);
      easeFactor += 0.15; 
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + (interval === 0 ? 1 : interval));

    const updatedCard = await prisma.flashcard.update({
      where: { id },
      data: { interval, easeFactor, nextReviewDate }
    });

    res.json(updatedCard);
  } catch (error) {
    console.error("Erro ao avaliar flashcard:", error);
    res.status(500).json({ error: "Falha ao avaliar flashcard." });
  }
});

// Requisita o serviço de síntese da Azure para converter respostas textuais em áudio narrado
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const region = process.env.AZURE_SPEECH_REGION;
    const key = process.env.AZURE_SPEECH_KEY;

    if (!text || !region || !key) {
      return res.status(400).json({ error: "Texto ou credenciais da Azure em falta." });
    }

    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' xml:gender='Female' name='en-US-AriaNeural'>
          ${text}
        </voice>
      </speak>`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'FluencyAI'
      },
      body: ssml
    });

    if (!response.ok) {
      throw new Error(`Erro na Azure: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error) {
    console.error("Erro na geração de áudio:", error);
    res.status(500).json({ error: "Falha ao gerar áudio com a Azure." });
  }
});

// Sincroniza dados do usuário logado e compila as estatísticas globais para o Dashboard
app.post('/api/user/profile', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório para sincronizar." });
    }

    // Recupera os dados do usuário ou realiza a sua inserção no sistema caso inexista
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name || "Estudante" }
      });
      console.log(`Novo usuário sincronizado: ${email}`);
    }

    // Conta a base analítica de evolução com base nas inserções cadastradas
    const flashcardsCount = await prisma.flashcard.count({ where: { userId: user.id } });
    const messagesCount = await prisma.message.count({ where: { userId: user.id } });

    // Computa a estimativa de horas ativas considerando aproximações do tempo das mensagens
    const studyHours = (messagesCount * 2) / 60; 
    
    // Atualiza progressivamente a qualificação do nível baseado na exposição aos cartões
    let currentLevel = "A1";
    if (flashcardsCount > 20) currentLevel = "A2";
    if (flashcardsCount > 50) currentLevel = "B1";
    if (flashcardsCount > 150) currentLevel = "B2";
    if (flashcardsCount > 300) currentLevel = "C1";

    // Define o engajamento de sequência considerando interações iniciais registradas
    const streak = messagesCount > 0 ? 1 : 0;

    res.json({
      userId: user.id,
      stats: {
        streak: streak.toString(),
        words: flashcardsCount.toString(),
        hours: studyHours.toFixed(1),
        level: user.level,
        studyTime: user.studyTime
      }
    });

  } catch (error) {
    console.error("Erro ao sincronizar perfil:", error);
    res.status(500).json({ error: "Falha ao obter dados do perfil." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});