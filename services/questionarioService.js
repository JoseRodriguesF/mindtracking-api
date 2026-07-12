import prisma from '../config/prisma.js';

function calcularIdade(dataNascimentoStr) {
    if (!dataNascimentoStr) return null;
    const dataNascimento = new Date(dataNascimentoStr);
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = dataNascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
    }
    return idade;
}

export class QuestionarioService {
    static async getCorrelacoesTendencias(usuarioId) {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true }
        });

        if (!usuarioExiste) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        // Chama a procedure armazenada no banco usando $queryRaw
        const correlacoes = await prisma.$queryRaw`
            SELECT * FROM analisar_tendencias_separadas(${Number(usuarioId)}::integer)
        `;

        return correlacoes.map(row => ({
            total_ocorrencias: Number(row.total_ocorrencias),
            classificacao: row.classificacao,
            texto_alternativa: row.texto_alternativa,
            texto_pergunta: row.texto_pergunta,
            pontuacao: row.pontuacao
        }));
    }

    static async getPontuacaoUsuario(usuarioId) {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true }
        });

        if (!usuarioExiste) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        const resultado = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM(a.pontuacao), 0)::int AS pontuacao_total,
                COUNT(DISTINCT r.questionario_id)::int as total_questionarios
            FROM respostas r
            JOIN alternativas a ON r.alternativa_id = a.id
            WHERE r.usuario_id = ${Number(usuarioId)}
        `;

        const pontuacao = resultado[0]?.pontuacao_total ?? 0;
        const totalQuestionarios = resultado[0]?.total_questionarios ?? 0;
        const pontuacaoMaxima = totalQuestionarios * 40;
        const nota_convertida = pontuacaoMaxima > 0 
            ? Math.min(Math.round((pontuacao / pontuacaoMaxima) * 10 * 100) / 100, 10)
            : 0;

        let nivel = "Bom";
        if (nota_convertida <= 4.9) {
            nivel = "Ruim";
        } else if (nota_convertida <= 7.4) {
            nivel = "Neutro";
        }

        return {
            nota: nota_convertida,
            nivel
        };
    }

    static async getPerguntas(isQuestionarioInicial) {
        const perguntas = await prisma.pergunta.findMany({
            where: isQuestionarioInicial ? { id: { gte: 1, lte: 10 } } : undefined,
            include: {
                alternativas: {
                    select: {
                        id: true,
                        texto: true,
                        pontuacao: true
                    }
                }
            },
            orderBy: { id: 'asc' }
        });

        return perguntas;
    }

    static async salvarRespostas(usuarioId, respostas) {
        const user = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true, questionario_inicial: true }
        });

        if (!user) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        if (user.questionario_inicial) {
            throw new Error('Você já respondeu o questionário inicial. Não é possível enviar novas respostas.');
        }

        // Cria o questionário inicial
        const questionario = await prisma.questionario.create({
            data: {
                usuario_id: Number(usuarioId),
                tipo: 'Inicial'
            }
        });

        // Inserção em lote (Bulk Insert) usando createMany do Prisma
        await prisma.resposta.createMany({
            data: respostas.map(r => ({
                usuario_id: Number(usuarioId),
                pergunta_id: Number(r.pergunta_id),
                alternativa_id: Number(r.alternativa_id),
                questionario_id: questionario.id
            }))
        });

        // Atualiza questionario_inicial para true
        await prisma.usuario.update({
            where: { id: Number(usuarioId) },
            data: { questionario_inicial: true }
        });
    }

    static async getHistoricoQuestionarios(usuarioId) {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true }
        });

        if (!usuarioExiste) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        const historico = await prisma.$queryRaw`
            SELECT 
                q.id AS questionario_id,
                q.data,
                q.tipo,
                COALESCE(SUM(a.pontuacao), 0)::int AS pontuacao,
                ROUND((COALESCE(SUM(a.pontuacao), 0) / 40.0) * 10, 2)::float AS nota_convertida
            FROM 
                questionarios q
            LEFT JOIN respostas r ON r.questionario_id = q.id
            LEFT JOIN alternativas a ON r.alternativa_id = a.id
            WHERE 
                q.usuario_id = ${Number(usuarioId)}
            GROUP BY 
                q.id, q.data, q.tipo
            ORDER BY 
                q.data DESC
        `;

        return historico;
    }

    static async getEstatisticasUsuario(usuarioId) {
        const user = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true, data_nascimento: true }
        });

        if (!user) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        const totalQuestionarios = await prisma.questionario.count({
            where: { usuario_id: Number(usuarioId) }
        });

        return {
            total_questionarios: totalQuestionarios,
            idade: calcularIdade(user.data_nascimento)
        };
    }

    static async verificarQuestionarioDiario(usuarioId) {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true }
        });

        if (!usuarioExiste) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        const resultado = await prisma.$queryRaw`
            SELECT id FROM questionarios
            WHERE usuario_id = ${Number(usuarioId)}
              AND data >= (CURRENT_DATE AT TIME ZONE 'UTC')
              AND data < ((CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'UTC')
        `;

        return resultado.length > 0;
    }

    static async getPerguntasDiarias() {
        const todasPerguntas = await prisma.pergunta.findMany({
            where: { id: { gte: 11 } },
            include: {
                alternativas: {
                    select: {
                        id: true,
                        texto: true,
                        pontuacao: true
                    }
                }
            },
            orderBy: { id: 'asc' }
        });

        if (todasPerguntas.length === 0) {
            throw new Error('Nenhuma pergunta encontrada para o questionário diário.');
        }

        const perguntasEmbaralhadas = todasPerguntas.sort(() => Math.random() - 0.5);
        const perguntasSelecionadas = perguntasEmbaralhadas.slice(0, 10);

        if (perguntasSelecionadas.length < 5) {
            throw new Error('Não há perguntas suficientes disponíveis para o questionário diário.');
        }

        return perguntasSelecionadas;
    }

    static async salvarRespostasDiarias(usuarioId, respostas) {
        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            select: { id: true }
        });

        if (!usuarioExiste) {
            throw new Error('Usuário não encontrado. Verifique se o ID está correto.');
        }

        const jaRespondido = await QuestionarioService.verificarQuestionarioDiario(usuarioId);
        if (jaRespondido) {
            throw new Error('Você já respondeu o questionário hoje. Volte amanhã para responder novamente.');
        }

        // Inserção usando data com fuso UTC
        const questionarioResult = await prisma.$queryRaw`
            INSERT INTO questionarios (usuario_id, data, tipo) 
            VALUES (${Number(usuarioId)}, (CURRENT_DATE AT TIME ZONE 'UTC'), 'Diario') 
            RETURNING id
        `;
        const questionario_id = questionarioResult[0]?.id;

        if (!questionario_id) {
            throw new Error('Erro ao criar questionário diário.');
        }

        // Inserção em lote (Bulk Insert)
        await prisma.resposta.createMany({
            data: respostas.map(r => ({
                usuario_id: Number(usuarioId),
                pergunta_id: Number(r.pergunta_id),
                alternativa_id: Number(r.alternativa_id),
                questionario_id: Number(questionario_id)
            }))
        });
    }
}
