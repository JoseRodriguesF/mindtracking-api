import { QuestionarioService } from '../services/questionarioService.js';

export async function verificarQuestionarioDiario(req, res) {
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
    const ja_respondido = await QuestionarioService.verificarQuestionarioDiario(usuario_id);
    return res.status(200).json({
      success: true,
      ja_respondido,
      message: ja_respondido
        ? 'Você já respondeu um questionário hoje. Volte amanhã para responder novamente.'
        : 'Você ainda não respondeu nenhum questionário hoje.'
    });
  } catch (error) {
    console.error('Erro ao verificar questionário:', error);
    return res.status(error.message.includes("não encontrado") ? 404 : 500).json({
      success: false,
      message: error.message || 'Não foi possível verificar o status dos questionários hoje. Por favor, tente novamente mais tarde.'
    });
  }
}

export async function getPerguntasDiarias(req, res) {
    try {
        const perguntasSelecionadas = await QuestionarioService.getPerguntasDiarias();
        return res.status(200).json({
            success: true,
            perguntas: perguntasSelecionadas,
            total_perguntas: perguntasSelecionadas.length,
            message: `Questionário diário gerado com ${perguntasSelecionadas.length} perguntas selecionadas aleatoriamente.`
        });
    } catch (error) {
        console.error('Erro ao buscar perguntas diárias:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Não foi possível carregar as perguntas do questionário diário. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function salvarRespostasDiarias(req, res) {
    const usuario_id = req.user?.id;
    const { respostas } = req.body;

    if (!usuario_id || !respostas || !Array.isArray(respostas) || respostas.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos. Pelo menos uma resposta deve ser fornecida.'
        });
    }

    if (respostas.length > 10) {
        return res.status(400).json({
            success: false,
            message: 'Número de respostas excede o limite permitido. O questionário diário deve ter no máximo 10 perguntas.'
        });
    }

  try {
    await QuestionarioService.salvarRespostasDiarias(usuario_id, respostas);
    return res.status(200).json({
      success: true,
      message: 'Questionário diário respondido com sucesso! Obrigado por sua participação.'
    });
  } catch (error) {
    console.error('Erro ao salvar respostas diárias:', error);
    return res.status(400).json({
        success: false,
        message: error.message || 'Não foi possível salvar suas respostas do questionário diário. Por favor, tente novamente mais tarde.'
    });
  }
}
