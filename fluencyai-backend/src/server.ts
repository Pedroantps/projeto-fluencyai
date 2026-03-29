import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares
app.use(cors()); // Permite que o frontend do Next.js converse com este backend
app.use(express.json()); // Permite receber dados em JSON

// Rota de teste
app.get('/api/status', (req, res) => {
  res.json({ message: 'FluencyAI Backend is running! 🚀' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
