// Importa o pacote 'pg' (PostgreSQL) para interagir com o banco de dados
import pkg from 'pg';
// Importa o pacote 'dotenv' para carregar variáveis de ambiente de um arquivo .env
import dotenv from 'dotenv';
import { readFileSync } from 'fs';


// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Desestrutura o objeto 'Pool' do pacote 'pg'
const { Pool } = pkg;

// Cria uma nova instância de Pool para gerenciar conexões com o banco de dados
const sslConfig = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;

const banco = new Pool({
    user: process.env.DB_USER, // Usuário do banco de dados (definido no .env)
    host: process.env.DB_HOST, // Host do banco de dados (definido no .env)
    database: process.env.DB_NAME, // Nome do banco de dados (definido no .env)
    password: process.env.DB_PASSWORD, // Senha do banco de dados (definido no .env)
    port: process.env.PORTA, // Porta do banco de dados (definido no .env)
    ssl: sslConfig,
});

banco.connect()
    .then(() => console.log("Banco de dados conectado!")) // Mensagem de sucesso ao conectar
    .catch(err => console.error("Erro ao conectar ao banco:", err)); // Mensagem de erro caso a conexão falhe

export default banco;
