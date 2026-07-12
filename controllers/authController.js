import { AuthService } from '../services/authService.js';
import {
    validateEmail,
    validatePassword,
    validateBirthdate,
    validatePhone,
    validateGender,
    validateName
} from '../utils/validation.js';

function setSessionCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
        // sem maxAge ou expires -> cookie de sessão (expira quando fechar o navegador/aba)
    });
}

export async function register(req, res) {
    const { nome, email, senha, confirmarSenha, data_nascimento, telefone, genero } = req.body;

    const nomeError = validateName(nome);
    if (nomeError) return res.status(400).json({ success: false, message: nomeError });

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const passwordError = validatePassword(senha, confirmarSenha);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });

    const birthdateError = validateBirthdate(data_nascimento);
    if (birthdateError) return res.status(400).json({ success: false, message: birthdateError });

    const phoneError = validatePhone(telefone);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });

    const genderError = validateGender(genero);
    if (genderError) return res.status(400).json({ success: false, message: genderError });

    try {
        const result = await AuthService.register({ nome, email, senha, data_nascimento, telefone, genero });
        setSessionCookie(res, result.token);

        return res.status(201).json({
            success: true,
            message: 'Conta criada com sucesso! Bem-vindo(a) ao MindTracking.',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao criar sua conta. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            success: false,
            message: 'E-mail e senha são obrigatórios para realizar o login'
        });
    }

    try {
        const result = await AuthService.login(email, senha);
        setSessionCookie(res, result.token);

        return res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso! Bem-vindo(a) de volta.',
            user: result.user,
            token: result.token
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao realizar o login. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function enviarCodigoRecuperacao(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'O e-mail é obrigatório para enviar o código de recuperação'
        });
    }

    try {
        await AuthService.enviarCodigoRecuperacao(email);
        return res.status(200).json({
            success: true,
            message: 'Código de recuperação enviado com sucesso para seu e-mail.'
        });
    } catch (error) {
        console.error('Erro ao processar recuperação:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.'
        });
    }
}

export async function verificarCodigoRecuperacao(req, res) {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
        return res.status(400).json({
            success: false,
            message: 'E-mail e código de recuperação são obrigatórios'
        });
    }

    try {
        await AuthService.verificarCodigoRecuperacao(email, codigo);
        return res.status(200).json({
            success: true,
            message: 'Código válido. Você pode prosseguir com a redefinição de senha.'
        });
    } catch (error) {
        console.error('Erro ao verificar código:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao verificar o código.'
        });
    }
}

export async function redefinirSenha(req, res) {
    const { email, senha, confirmarSenha } = req.body;

    if (!email || !senha || !confirmarSenha) {
        return res.status(400).json({
            success: false,
            message: 'Todos os campos são obrigatórios para redefinir a senha'
        });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).json({
            success: false,
            message: 'As senhas não coincidem. Por favor, verifique e tente novamente.'
        });
    }

    try {
        await AuthService.redefinirSenha(email, senha);
        return res.status(200).json({
            success: true,
            message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.'
        });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Ocorreu um erro ao redefinir sua senha.'
        });
    }
}

export async function deleteAccount(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        await AuthService.deleteAccount(userId);
        res.clearCookie('token');
        return res.status(200).json({ success: true, message: 'Conta e todos os dados relacionados excluídos com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        return res.status(500).json({ success: false, message: 'Erro ao excluir conta. Tente novamente mais tarde.' });
    }
}

export async function getProfile(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    try {
        const user = await AuthService.getProfile(userId);
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Erro ao obter perfil do usuário:', error);
        return res.status(500).json({ success: false, message: error.message || 'Não foi possível obter o perfil neste momento.' });
    }
}

export async function updateProfile(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    const { nome, data_nascimento, telefone, genero } = req.body;

    if (nome !== undefined) {
        const error = validateName(nome);
        if (error) return res.status(400).json({ success: false, message: error });
    }

    if (data_nascimento !== undefined) {
        const error = validateBirthdate(data_nascimento);
        if (error) return res.status(400).json({ success: false, message: error });
    }

    if (telefone !== undefined) {
        const error = validatePhone(telefone);
        if (error) return res.status(400).json({ success: false, message: error });
    }

    if (genero !== undefined) {
        const error = validateGender(genero);
        if (error) return res.status(400).json({ success: false, message: error });
    }

    try {
        const user = await AuthService.updateProfile(userId, { nome, data_nascimento, telefone, genero });
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return res.status(400).json({ success: false, message: error.message || 'Não foi possível atualizar o perfil neste momento.' });
    }
}
