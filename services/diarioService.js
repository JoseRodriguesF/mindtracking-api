import prisma from '../config/prisma.js';
import { ChatService } from './chatService.js';

export class DiarioService {
    static async mandarDiario(usuarioId, titulo, texto) {
        // 1️⃣ Verificar se já existe diário na data atual para este usuário (entre 00:00:00 e 23:59:59 UTC do dia de hoje)
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        const diarioExistente = await prisma.diario.findFirst({
            where: {
                usuario_id: Number(usuarioId),
                data_hora: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (diarioExistente) {
            throw new Error('Já existe um diário registrado para a data de hoje.');
        }

        // 2️⃣ Analisar o texto com a Athena antes de salvar
        const analise = await ChatService.analisarTextoComAthena(texto);

        // 3️⃣ Criar entrada já preenchida com a análise no Prisma
        const novaEntrada = await prisma.diario.create({
            data: {
                usuario_id: Number(usuarioId),
                titulo,
                texto,
                emocao_predominante: analise.emocao_predominante,
                intensidade_emocional: analise.intensidade_emocional,
                comentario_athena: analise.comentario_athena
            }
        });

        return novaEntrada;
    }

    static async buscarDiarios(usuarioId) {
        const diarios = await prisma.diario.findMany({
            where: { usuario_id: Number(usuarioId) },
            orderBy: { data_hora: 'desc' },
            select: {
                data_hora: true,
                titulo: true,
                texto: true,
                emocao_predominante: true,
                intensidade_emocional: true,
                comentario_athena: true
            }
        });

        return diarios;
    }

    static async buscarDiarioPorId(usuarioId, diarioId) {
        const diario = await prisma.diario.findFirst({
            where: {
                id: Number(diarioId),
                usuario_id: Number(usuarioId)
            },
            select: {
                id: true,
                data_hora: true,
                titulo: true,
                texto: true,
                emocao_predominante: true,
                intensidade_emocional: true,
                comentario_athena: true
            }
        });

        if (!diario) {
            throw new Error('Entrada do diário não encontrada ou não pertence ao usuário');
        }

        return diario;
    }
}
