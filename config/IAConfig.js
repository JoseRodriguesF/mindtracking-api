// Importa o SDK da IA para interagir com a API
import OpenAI from 'openai';
// Importa o pacote dotenv para carregar variáveis de ambiente de um arquivo .env
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env da raiz e da pasta config como fallback
dotenv.config();
dotenv.config({ path: "./config/.env" });

// Cria uma instância do cliente IA usando a chave de API definida nas variáveis de ambiente
const openai = new OpenAI({ apiKey: process.env.API_KEY });

// Exporta a instância do cliente IA para ser usada em outros arquivos
export default openai;