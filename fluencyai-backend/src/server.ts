import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import multer from 'multer'; // Importamos o multer
import fs from 'fs'; // Biblioteca nativa para lidar com arquivos

// Carrega as variáveis do .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração do Multer (vamos salvar os áudios temporariamente na pasta /tmp)
const upload = multer({ dest: '/tmp/' });

// Inicializando o cliente Groq
const groq = new Groq();

// Puxando as credenciais do Gen do .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "SUA_API_KEY");

// Rota 1: Transcrever Áudio (Groq Whisper) - NOVA!
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo de áudio foi enviado." });
    }

    // 1. Pegamos o caminho do arquivo temporário salvo pelo Multer
    const originalPath = req.file.path;
    // 2. Adicionamos a extensão .webm que o Groq exige
    const newPath = originalPath + '.webm'; 
    // 3. Renomeamos o arquivo na máquina
    fs.renameSync(originalPath, newPath);

    // Chama a API Whisper do Groq enviando o arquivo renomeado
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(newPath), 
      model: "whisper-large-v3",
      prompt: "The audio may contain English or Portuguese speech. Please transcribe naturally with punctuation.", 
      response_format: "json",
    });

    // Apaga o arquivo temporário da máquina para não encher o disco
    fs.unlinkSync(newPath);

    // Devolve o texto transcrito e pontuado
    res.json({ text: transcription.text });

  } catch (error) {
    console.error("Erro na transcrição Whisper:", error);
    res.status(500).json({ error: "Falha ao transcrever o áudio." });
  }
});

// Rota 2: Chat (Llama-3-70b) - ATUALIZADA COM PROMPT BILÍNGUE!
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "A mensagem do usuário é obrigatória." });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          // MUDANÇA CRUCIAL AQUI: O novo prompt para Code-Switching
          content: `You are an expert, strict but friendly native English teacher named Ana.
          
          CORE RULES:
          1. ALWAYS reply in natural, fluent English to maintain the conversation flow.
          2. Analyze the user's input for ANY Portuguese words, grammar mistakes, or awkward phrasing.

          JSON RESPONSE FORMAT (MUST FOLLOW EXACTLY):
          {
            "reply": "Your conversational response in ENGLISH.",
            "correction": null // If the user's English is PERFECT and contains NO Portuguese.
          }

          IF THERE IS A MISTAKE OR PORTUGUESE USED:
          {
            "reply": "Your conversational response in ENGLISH.",
            "correction": {
              "original": "the awkward or Portuguese phrase",
              "corrected": "the strictly correct English phrase",
              "explanation": "If Portuguese was used, translate it and explain the dynamic. If it was a grammar error, explain the rule in English."
            }
          }`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Um pouco mais baixo para garantir o formato JSON estrito
      response_format: { type: "json_object" }
    });

    // Pega o texto da IA e transforma em um objeto JavaScript
    let aiResponseText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // SAFE PARSE: Tira qualquer formatação markdown
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedResponse = JSON.parse(aiResponseText);

    res.json({
      reply: parsedResponse.reply || "I didn't quite catch that. Could you repeat?",
      correction: parsedResponse.correction || null
    });

  } catch (error) {
    console.error("Erro fatal na comunicação com o Groq:", error);
    res.status(500).json({ error: "Falha na comunicação com a IA." });
  }
});

// Rota 4: Gerar Flashcards (Google Gemini)
app.post('/api/flashcards', async (req, res) => {
  try {
    const { chatHistory } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "O histórico do chat é obrigatório." });
    }

    // Instancia o modelo ultra-rápido do Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // O Prompt de Engenharia para o Gemini
    const prompt = `
      Você é um especialista em ensino de idiomas. Analise o seguinte histórico de chat entre um aluno brasileiro e uma professora de inglês (AI).
      
      Sua tarefa: Identifique de 3 a 5 palavras, expressões (phrasal verbs) ou regras gramaticais que o aluno errou, teve dificuldade, ou que seriam ótimas para ele revisar.
      
      Retorne ESTRITAMENTE um array JSON contendo objetos com "front" (a palavra/frase em inglês) e "back" (a tradução para português + uma dica super curta).
      Não use formatação markdown, apenas o JSON puro.
      
      Exemplo de saída desejada:
      [
        { "front": "Went", "back": "Passado de 'go' (ir). Ex: I went to the mall." },
        { "front": "Playing chess", "back": "Jogar xadrez. O verbo play é usado para esportes e jogos." }
      ]

      Histórico do Chat:
      ${JSON.stringify(chatHistory)}
    `;

    // Chama a API do Google
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text();

    // Safe Parse: Limpa marcações markdown caso o Gemini as envie
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const flashcards = JSON.parse(aiResponseText);

    res.json({ flashcards });

  } catch (error) {
    console.error("Erro ao gerar flashcards com Gemini:", error);
    res.status(500).json({ error: "Falha ao gerar os flashcards." });
  }
});

// Rota 3: Texto em Voz (Azure TTS)
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});