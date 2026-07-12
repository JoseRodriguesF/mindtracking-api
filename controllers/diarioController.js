import { DiarioService } from '../services/diarioService.js';

export async function mandarDiario(req, res) {
    const { texto, titulo } = req.body;
    const usuario_id = req.user?.id;

    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'O campo texto é obrigatório e não pode estar vazio'
        });
    }

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'O campo título é obrigatório e não pode estar vazio'
        });
    }

    if (titulo.length > 255) {
        return res.status(400).json({
            success: false,
            message: 'O título do diário deve conter no máximo 255 caracteres'
        });
    }

    if (texto.length > 10000) {
        return res.status(400).json({
            success: false,
            message: 'O texto do diário deve conter no máximo 10000 caracteres'
        });
    }

    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        const novaEntrada = await DiarioService.mandarDiario(usuario_id, titulo, texto);
        return res.status(201).json({
            success: true,
            message: 'Entrada do diário criada com sucesso e análise da Athena concluída.',
            entrada: novaEntrada
        });
    } catch (error) {
        console.error('Erro ao criar entrada no diário:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Erro interno do servidor ao criar entrada no diário'
        });
    }
}

export async function buscarDiarios(req, res) {
    const usuario_id = req.user?.id;
    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        const entradas = await DiarioService.buscarDiarios(usuario_id);
        return res.status(200).json({
            success: true,
            message: 'Entradas do diário recuperadas com sucesso',
            entradas
        });
    } catch (error) {
        console.error('Erro ao buscar entradas do diário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao buscar entradas do diário'
        });
    }
}

export async function buscarDiarioPorId(req, res) {
    const usuario_id = req.user?.id;
    const diario_id = req.params.id;

    if (!usuario_id) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    if (!diario_id) {
        return res.status(400).json({
            success: false,
            message: 'ID do diário não fornecido'
        });
    }

    try {
        const entrada = await DiarioService.buscarDiarioPorId(usuario_id, diario_id);
        return res.status(200).json({
            success: true,
            message: 'Entrada do diário recuperada com sucesso',
            entrada
        });
    } catch (error) {
        console.error('Erro ao buscar entrada do diário por ID:', error);
        return res.status(404).json({
            success: false,
            message: error.message || 'Entrada do diário não encontrada ou não pertence ao usuário'
        });
    }
}
