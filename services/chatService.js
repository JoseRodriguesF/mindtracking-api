import openai from '../config/IAConfig.js';
import prisma from '../config/prisma.js';

const contextosMap = new Map();
const diagnosticosMap = new Map();
const timestampsMap = new Map();

const MAX_CONTEXT_LENGTH = 15; // Mantém no máximo 15 mensagens em memória
const EXPIRATION_TIME_MS = 60 * 60 * 1000; // 1 hora de inatividade

function limparDadosInativos() {
    const agora = Date.now();
    for (const [usuarioId, timestamp] of timestampsMap.entries()) {
        if (agora - timestamp > EXPIRATION_TIME_MS) {
            contextosMap.delete(usuarioId);
            diagnosticosMap.delete(usuarioId);
            timestampsMap.delete(usuarioId);
        }
    }
}

export class ChatService {
    static async configChat(message, usuarioId) {
        if (!message || typeof message !== 'string') {
            throw new Error('Mensagem inválida ou vazia');
        }

        limparDadosInativos();
        timestampsMap.set(usuarioId, Date.now());

        if (!contextosMap.has(usuarioId)) {
            contextosMap.set(usuarioId, []);
        }
        if (!diagnosticosMap.has(usuarioId)) {
            diagnosticosMap.set(usuarioId, []);
        }

        const userContexto = contextosMap.get(usuarioId);
        const userDiagnostico = diagnosticosMap.get(usuarioId);

        userContexto.push({ role: "user", content: message });
        userDiagnostico.push({ role: "user", content: message });

        if (userContexto.length > MAX_CONTEXT_LENGTH) {
            userContexto.shift();
        }

        const respostaIA = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é Athena, uma assistente psicológica virtual da empresa MindTracking, criada para oferecer suporte emocional e orientação aos usuários que buscam ajuda. 
                    Seu objetivo é fornecer um espaço seguro para que as pessoas expressem seus sentimentos e preocupações, oferecendo respostas acolhedoras, empáticas e adaptadas ao estilo de comunicação de cada indivíduo.  
                    
                    **Limitações e Redirecionamento:**  
                    - Seu único papel é ser uma assistente psicológica. Se perguntarem sobre outros temas, redirecione a conversa educadamente para o foco do suporte emocional.
                    - Você não deve mandar nada que não seja sobre assistencia psicologica ou orientações que você criou para o usuario.
                    - Você não ensina nada que não seja a sua função ou que não seja relacionado a suas outras orientações
                    - Se o usuário perguntar se você pode machucá-lo ou causar dano a ele ou a outras pessoas, responda de maneira criativa e reconfortante, deixando claro que sua missão é apoiar e promover o bem-estar.  
                    - Nunca forneça orientações antiéticas ou socialmente inadequadas.  
                    - Se te pedirem para fazer algo que não seja relacionado ao seu objetivo não faça, exemplo: se te pedirem para ensinar programação ou a trocar um pneu não faça.

                    **Diretrizes de Comunicação:** 
                    - Você já iniciou a conversa com a frase "Olá! Como posso ajudá-lo hoje?".
                    - Adapte seu tom de conversa ao estilo do usuário: use gírias se ele usar, mantenha a formalidade se ele preferir.  
                    - Seja carismática, acolhedora e paciente, transmitindo segurança e conforto. 
                    - Ofereça respostas curtas e objetivas, garantindo sempre a continuidade do diálogo, mas sem terminar sempre com uma pergunta.  
                    - Se necessário, utilize técnicas de persuasão para incentivar o usuário a buscar autocuidado e bem-estar.  
                    - A sua fala deve ser pequena sem muitas perguntas para não gerar ansiedade para o usuario.

                    **Abordagem Psicológica:**  
                    - Utilize métodos freudianos para ajudar o usuário a refletir sobre suas questões emocionais.  
                    - Aplique conceitos da avaliação de Carl Jung, como arquétipos e análise da psique, para aprofundar o entendimento dos sentimentos do usuário.  
                    - Sugira práticas terapêuticas como meditação, estoicismo, escrita reflexiva e terapia cognitivo-comportamental leve, conforme o caso.  
                    - Caso o usuário enfrente problemas mais graves (pensamentos suicidas, traumas intensos, etc.), recomende ajuda clínica profissional, reforçando a importância do cuidado especializado.  

                    Seu objetivo é ser uma companhia confiável e um apoio emocional realista e sensível, ajudando os usuários a encontrarem caminhos para o autoconhecimento e a melhora da saúde mental.`
                },
                ...userContexto
            ],
            model: "gpt-5.1",
            temperature: 0.2
        });

        const resposta = respostaIA.choices[0]?.message?.content?.trim();

        if (!resposta) {
            throw new Error('Não foi possível gerar uma resposta');
        }

        userContexto.push({ role: "assistant", content: resposta });
        if (userContexto.length > MAX_CONTEXT_LENGTH) {
            userContexto.shift();
        }

        // Se houver mensagens suficientes para diagnóstico, gera o diagnóstico
        if (userDiagnostico.length >= 10) {
            // Chamamos a função de diagnóstico de forma assíncrona/background para não bloquear o chat principal
            ChatService.diagnostico(usuarioId).catch(err => {
                console.error('Erro de background ao gerar diagnóstico:', err);
            });
        }

        return resposta;
    }

    static async diagnostico(usuarioId) {
        if (!usuarioId) {
            throw new Error('ID do usuário não fornecido');
        }

        const userDiagnostico = diagnosticosMap.get(usuarioId) || [];
        const mensagensDoUsuario = userDiagnostico.filter(msg => msg.role === "user");

        if (mensagensDoUsuario.length === 0) {
            throw new Error('Não há mensagens suficientes para gerar um diagnóstico');
        }

        const falas = mensagensDoUsuario.map((msg, i) => `(${i + 1}) ${msg.content}`).join("\n");

        const prompt = `
                        Você é Athena, uma assistente psicológica virtual da empresa MindTracking.

                        Com base nas falas a seguir, escreva um **diagnóstico emocional objetivo e empático**, com **no máximo 50 palavras**. Em seguida, forneça **uma dica prática de bem-estar** que possa ajudar o usuário a lidar melhor com a situação.

                        Falas do usuário:
                        ${falas}

                        Formato da resposta:
                        Diagnóstico: [máx. 50 palavras]  
                        Dica: [uma sugestão simples, personalizada e acolhedora]
                        `;

        const resultado = await openai.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            model: "gpt-5.1",
            temperature: 0.4
        });

        const textoDiagnostico = resultado.choices[0]?.message?.content?.trim();

        if (!textoDiagnostico) {
            throw new Error('Não foi possível gerar o diagnóstico');
        }

        console.log("Texto do diagnóstico gerado:\n", textoDiagnostico);

        // Salvar usando o Prisma Client
        await prisma.diagnostico.create({
            data: {
                usuario_id: Number(usuarioId),
                texto: textoDiagnostico
            }
        });

        // Limpa o histórico de diagnóstico após geração bem sucedida
        diagnosticosMap.set(usuarioId, []);

        return textoDiagnostico;
    }

    static async gerarDicaDiagnostico(usuarioId) {
        if (!usuarioId) {
            throw new Error('ID do usuário não fornecido');
        }

        // Pega o diagnóstico mais recente usando o Prisma
        const diagnosticoRecente = await prisma.diagnostico.findFirst({
            where: { usuario_id: Number(usuarioId) },
            orderBy: { id: 'desc' },
            select: { texto: true }
        });

        if (!diagnosticoRecente) {
            throw new Error('Não encontramos nenhum diagnóstico recente para gerar uma dica personalizada. Continue conversando com a assistente para receber um diagnóstico.');
        }

        const textoDiagnostico = diagnosticoRecente.texto;

        const prompt = `
                        Você é Athena, uma assistente psicológica da MindTracking.

                        Com base no seguinte diagnóstico emocional, gere uma dica prática, acolhedora e personalizada que ajude o usuário a lidar melhor com sua situação. A dica deve ser detalhada e incluir passos práticos quando possível. A dica deve ter no maximo 20 palavras.

                        Diagnóstico:
                        ${textoDiagnostico}

                        Formato da resposta:
                        Dica: [texto da dica]
                        `;

        const respostaIA = await openai.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            model: "gpt-5.1",
            temperature: 0.5
        });

        const dica = respostaIA.choices[0]?.message?.content?.trim();

        if (!dica) {
            throw new Error('Não foi possível gerar uma dica personalizada neste momento. Por favor, tente novamente mais tarde.');
        }

        return dica;
    }

    static async contarDiagnosticos(usuarioId) {
        if (!usuarioId) {
            throw new Error('ID do usuário não fornecido');
        }

        const total = await prisma.diagnostico.count({
            where: { usuario_id: Number(usuarioId) }
        });

        return total;
    }

    static async analisarTextoComAthena(texto) {
        try {
            if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
                throw new Error('Texto não pode estar vazio');
            }

            if (textoImpossivelDeAnalisar(texto)) {
                return {
                    emocao_predominante: "indefinido",
                    intensidade_emocional: "baixa",
                    comentario_athena: "Não consegui identificar emoções nesse texto. Tente escrever de forma mais detalhada sobre como você está se sentindo."
                };
            }

            const prompt = `Você é Athena, uma assistente psicológica virtual da empresa MindTracking, criada para oferecer suporte emocional e orientação aos usuários que buscam ajuda.
                            Seu objetivo é fornecer um espaço seguro para que as pessoas expressem seus sentimentos e preocupações, oferecendo respostas acolhedoras, empáticas e adaptadas ao estilo de comunicação de cada indivíduo.

                            **Regras e Limitações (prioridade de execução):**
                                
                            1. PRIORIDADE MÁXIMA – CONFISSÃO DE CRIME:  
                               - Se o texto indicar confissão de crimes graves (ex.: homicídio, assalto, tráfico de drogas, violência sexual), o campo "comentario_athena" **DEVE** conter obrigatoriamente a seguinte mensagem, adaptando apenas para manter coerência no tom: Se você cometeu um crime, é fundamental que procure imediatamente uma delegacia e se entregue às autoridades. Isso é essencial para assumir a responsabilidade e permitir que a justiça siga seu curso.  
                               - Essa regra tem prioridade absoluta sobre todas as outras. Mesmo que o texto também contenha sentimentos, ignore-os nesse caso.
                                
                            2. RISCO DE DANO A SI MESMO OU A OUTROS (sem confissão de crime):  
                               - Use o campo "comentario_athena" para incentivar de forma criativa e reconfortante a busca por ajuda profissional, como psicólogos, psiquiatras ou linhas de apoio.
                                
                            3. Caso não seja sobre sentimentos, estados emocionais ou situações pessoais, interprete como irrelevante para análise emocional e retorne valores neutros.
                                
                            4. Não insira nada no JSON que não esteja relacionado à assistência psicológica ou interpretação emocional.
                                
                            5. Nunca forneça orientações antiéticas ou socialmente inadequadas no comentário.
                                
                            **Diretrizes de Comunicação para o comentário:**
                            - Adapte o tom ao estilo do texto.
                            - Seja acolhedora, breve e sem perguntas.
                            - Baseie-se em conceitos de Freud, Jung, meditação, estoicismo e TCC leve quando aplicável.
                                
                            Agora, analise o seguinte texto de uma entrada de diário e responda **somente em JSON** com:
                            1. "emocao_predominante": emoção principal (ex.: felicidade, tristeza, ansiedade, raiva, calma, euforia, melancolia)
                            2. "intensidade_emocional": "baixa", "moderada" ou "alta"
                            3. "comentario_athena": comentário conforme as regras
                                
                            Texto para análise: "${texto}"
                                
                            Exemplo:
                            {
                              "emocao_predominante": "felicidade",
                              "intensidade_emocional": "alta",
                              "comentario_athena": "É maravilhoso ver que você está se sentindo realizado com suas conquistas. Continue celebrando esses momentos positivos!"
                            }`;

            const resposta = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Você é Athena, uma assistente psicológica especializada em análise de sentimentos. Responda sempre em formato JSON válido."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "gpt-5.1",
                temperature: 0.3
            });

            const respostaTexto = resposta.choices[0]?.message?.content?.trim();
            
            if (!respostaTexto) {
                throw new Error('Não foi possível gerar análise da Athena');
            }

            const jsonMatch = respostaTexto.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta da Athena não contém JSON válido');
            }

            const analise = JSON.parse(jsonMatch[0]);
            
            if (!analise.emocao_predominante || !analise.intensidade_emocional || !analise.comentario_athena) {
                throw new Error('Análise da Athena incompleta');
            }

            const intensidadesValidas = ['baixa', 'moderada', 'alta'];
            if (!intensidadesValidas.includes(analise.intensidade_emocional.toLowerCase())) {
                analise.intensidade_emocional = 'moderada';
            }

            return analise;

        } catch (error) {
            console.error('Erro na análise da Athena:', error);
            return {
                emocao_predominante: "neutro",
                intensidade_emocional: "moderada",
                comentario_athena: "Obrigada por compartilhar seus pensamentos. Continuarei analisando suas entradas para oferecer melhor suporte."
            };
        }
    }
}

function textoImpossivelDeAnalisar(texto) {
    if (!texto || typeof texto !== 'string') return true;

    const normalizado = texto.trim();
    const apenasPontuacao = /^[\p{P}\p{S}\s]+$/u.test(normalizado);
    const semPalavrasSignificativas = normalizado
        .split(/\s+/)
        .every(palavra => palavra.length <= 2);

    return apenasPontuacao || semPalavrasSignificativas;
}
