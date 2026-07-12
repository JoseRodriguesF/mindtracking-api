import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express'; 
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import questionarioRoutes from './routes/questionarioRoutes.js';
import diarioRoutes from './routes/diarioRoutes.js'; 
import relatorioRoutes from './routes/relatorioRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static("public"));

app.use('/api', chatRoutes);
app.use('/auth', authRoutes);
app.use('/questionario', questionarioRoutes);
app.use('/api/diario', diarioRoutes);
app.use("/", relatorioRoutes)


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
// Nodemon trigger restart comment

