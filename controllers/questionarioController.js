import { QuestionarioService } from '../services/questionarioService.js';

export async function getCorrelacoesTendencias(req, res) {
    const { usuario_id } = req.params;
    const authedUserId = req.user?.id;
  
    if (!usuario_id) {
        return res.status(400).json({
            success: false,
            message: 'ID do usuário não fornecido. Por favor, forneça um ID válido.'
        });
    }

    if (parseInt(usuario_id, 10) !== authedUserId) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você só pode acessar suas próprias informações.'
        });
    }
  
    try {
        const correlacoes = await QuestionarioService.getCorrelacoesTendencias(usuario_id);
        return res.status(200).json({
            success: true,
            correlacoes,
            message: 'Análise de tendências realizada com sucesso.'
        });
    } catch (error) {
        console.error("Erro ao analisar tendências:", error);
        return res.status(error.message.includes("não encontrado") ? 404 : 500).json({
            success: false,
            message: error.message || 'Não foi possível analisar as tendências neste momento. Por favor, tente novamente mais tarde.'
        });
    }
}
  
export async function getPontuacaoUsuario(req, res) {
    const { usuario_id } = req.params;
    const authedUserId = req.user?.id;

    if (!usuario_id) {
        return res.status(400).json({
            success: false,
            message: 'ID do usuário não fornecido. Por favor, forneça um ID válido.'
        });
    }

    if (parseInt(usuario_id, 10) !== authedUserId) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você só pode acessar suas próprias informações.'
        });
    }

    try {
        const { nota, nivel } = await QuestionarioService.getPontuacaoUsuario(usuario_id);
        return res.status(200).json({
            success: true,
            nota,
            nivel,
            message: 'Pontuação calculada com sucesso.'
        });
    } catch (error) {
        console.error("Erro ao calcular pontuação:", error);
        return res.status(error.message.includes("não encontrado") ? 404 : 500).json({
            success: false,
            message: error.message || 'Não foi possível calcular sua pontuação neste momento. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function getPerguntas(req, res) {
    try {
        const isQuestionarioInicial = req.query.questionario_inicial !== 'false';
        const perguntas = await QuestionarioService.getPerguntas(isQuestionarioInicial);
        
        return res.status(200).json({
            success: true,
            perguntas,
            message: 'Perguntas carregadas com sucesso.'
        });
    } catch (error) {
        console.error('Erro ao buscar perguntas:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Não foi possível carregar as perguntas neste momento. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function salvarRespostas(req, res) {
    const usuario_id = req.user?.id;
    const { respostas } = req.body;

    if (!usuario_id || !respostas || !Array.isArray(respostas) || respostas.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos. Pelo menos uma resposta deve ser fornecida.'
        });
    }

    try {
        await QuestionarioService.salvarRespostas(usuario_id, respostas);
        return res.status(200).json({
            success: true,
            message: 'Questionário respondido com sucesso! Obrigado por sua participação.'
        });
    } catch (error) {
        console.error('Erro ao salvar respostas:', error);
        return res.status(400).json({ 
            success: false, 
            message: error.message || 'Não foi possível salvar suas respostas neste momento. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function getHistoricoQuestionarios(req, res) {
    const { usuario_id } = req.params;
    const authedUserId = req.user?.id;

    if (!usuario_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID do usuário não fornecido. Por favor, forneça um ID válido.' 
        });
    }

    if (parseInt(usuario_id, 10) !== authedUserId) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você só pode acessar suas próprias informações.'
        });
    }
    
    try {
        const historico = await QuestionarioService.getHistoricoQuestionarios(usuario_id);
        return res.status(200).json({
            success: true,
            message: 'Histórico de questionários carregado com sucesso.',
            historico
        });
    } catch (error) {
        console.error("Erro ao buscar histórico de questionários:", error);
        return res.status(error.message.includes("não encontrado") ? 404 : 500).json({ 
            success: false, 
            message: error.message || 'Não foi possível carregar seu histórico de questionários neste momento. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function getEstatisticasUsuario(req, res) {
    const { usuario_id } = req.params;
    const authedUserId = req.user?.id;

    if (!usuario_id) {
        return res.status(400).json({
            success: false,
            message: 'ID do usuário não fornecido. Por favor, forneça um ID válido.'
        });
    }

    if (parseInt(usuario_id, 10) !== authedUserId) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Você só pode acessar suas próprias informações.'
        });
    }

    try {
        const estatisticas = await QuestionarioService.getEstatisticasUsuario(usuario_id);
        return res.status(200).json({
            success: true,
            message: 'Estatísticas do usuário obtidas com sucesso.',
            estatisticas
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas do usuário:', error);
        return res.status(error.message.includes("não encontrado") ? 404 : 500).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao obter as estatísticas do usuário. Por favor, tente novamente mais tarde.'
        });
    }
}