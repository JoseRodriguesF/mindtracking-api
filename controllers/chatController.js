import { ChatService } from '../services/chatService.js';

export async function chatHandler(req, res) {
    const { message } = req.body;
    const usuarioId = req.user?.id;

    if (!message) {
        return res.status(400).json({ 
            success: false,
            message: 'Por favor, envie uma mensagem para continuar a conversa.' 
        });
    }

    if (!usuarioId) {
        return res.status(401).json({ 
            success: false,
            message: 'Você precisa estar autenticado para usar o chat.' 
        });
    }

    try {
        const resposta = await ChatService.configChat(message, usuarioId);
        return res.json({ 
            success: true,
            response: resposta 
        });
    } catch (error) {
        console.error('Erro no chat:', error);
        return res.status(500).json({ 
            success: false,
            message: error.message || 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.' 
        });
    }
}

export async function diagnostico(req, res) {
    // Caso seja chamado via rota diretamente
    const usuarioId = req.user?.id;
    if (!usuarioId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        const textoDiagnostico = await ChatService.diagnostico(usuarioId);
        return res.json({
            success: true,
            diagnostico: textoDiagnostico
        });
    } catch (error) {
        console.error('Erro ao gerar diagnóstico:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Não foi possível gerar o diagnóstico neste momento.'
        });
    }
}

export async function gerarDicaDiagnostico(req, res) {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ 
            success: false,
            message: 'Você precisa estar autenticado para receber dicas personalizadas.' 
        });
    }

    try {
        const dica = await ChatService.gerarDicaDiagnostico(usuarioId);
        return res.json({ 
            success: true,
            dica 
        });
    } catch (error) {
        console.error("Erro ao gerar dica:", error);
        return res.status(500).json({ 
            success: false,
            message: error.message || 'Ocorreu um erro ao gerar sua dica personalizada. Por favor, tente novamente mais tarde.' 
        });
    }
}

export async function contarDiagnosticos(req, res) {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
        return res.status(401).json({ success: false, message: 'Você precisa estar autenticado para contar diagnósticos.' });
    }

    try {
        const total = await ChatService.contarDiagnosticos(usuarioId);
        return res.json({ success: true, total });
    } catch (error) {
        console.error('Erro ao contar diagnósticos:', error);
        return res.status(500).json({ success: false, message: 'Erro ao contar diagnósticos' });
    }
}
