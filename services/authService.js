import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const SECRET_KEY = process.env.JWT_KEY;

function gerarCodigoVerificacao() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

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

export class AuthService {
    static async register({ nome, email, senha, data_nascimento, telefone, genero }) {
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            throw new Error('Este e-mail já está cadastrado em nossa plataforma. Por favor, utilize outro e-mail ou faça login.');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: senhaCriptografada,
                data_nascimento: new Date(data_nascimento),
                telefone,
                genero,
                questionario_inicial: false,
                email_verificado: true
            }
        });

        const token = jwt.sign({ id: novoUsuario.id, email: novoUsuario.email }, SECRET_KEY, { expiresIn: '1h' });

        return {
            token,
            user: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                data_nascimento: novoUsuario.data_nascimento,
                telefone: novoUsuario.telefone,
                genero: novoUsuario.genero,
                questionario_inicial: novoUsuario.questionario_inicial,
                email_verificado: true
            }
        };
    }

    static async login(email, senha) {
        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('E-mail não encontrado. Verifique se o e-mail está correto ou crie uma nova conta.');
        }

        const senhaCorreta = await bcrypt.compare(senha, user.senha); 
        if (!senhaCorreta) {
            throw new Error('Senha incorreta. Por favor, verifique sua senha e tente novamente.');
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

        return {
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                questionario_inicial: user.questionario_inicial,
                email_verificado: true
            }
        };
    }

    static async enviarCodigoRecuperacao(email) {
        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('E-mail não encontrado. Verifique se o e-mail está correto.');
        }

        const codigo = gerarCodigoVerificacao();
        
        await prisma.usuario.update({
            where: { email },
            data: {
                codigo_recuperacao: codigo,
                tentativas_recuperacao: 0
            }
        });
        
        console.log(`[MindTracking - Recuperação de Senha] E-mail para: ${email} | Código: ${codigo}`);
    }

    static async verificarCodigoRecuperacao(email, codigo) {
        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('E-mail não encontrado. Verifique se o e-mail está correto.');
        }

        if (user.codigo_recuperacao !== codigo) {
            const tentativas = (user.tentativas_recuperacao || 0) + 1;

            if (tentativas >= 3) {
                const novoCodigo = gerarCodigoVerificacao();
                await prisma.usuario.update({
                    where: { email },
                    data: {
                        codigo_recuperacao: novoCodigo,
                        tentativas_recuperacao: 0
                    }
                });

                console.log(`[MindTracking - Novo Código de Recuperação] E-mail para: ${email} | Novo Código: ${novoCodigo}`);

                throw new Error('Número máximo de tentativas excedido. Um novo código foi enviado para o seu e-mail.');
            }

            await prisma.usuario.update({
                where: { email },
                data: { tentativas_recuperacao: tentativas }
            });

            throw new Error(`Código inválido. Você ainda tem ${3 - tentativas} tentativa(s) restante(s).`);
        }

        await prisma.usuario.update({
            where: { email },
            data: { tentativas_recuperacao: 0 }
        });
    }

    static async redefinirSenha(email, senha) {
        const user = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('Nenhum usuário encontrado com este e-mail.');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        await prisma.usuario.update({
            where: { email },
            data: {
                senha: senhaCriptografada,
                codigo_recuperacao: null,
                tentativas_recuperacao: 0
            }
        });
    }

    static async deleteAccount(userId) {
        // Prisma cascade deletes automatically based on relational configurations in schema.prisma
        await prisma.usuario.delete({
            where: { id: userId }
        });
    }

    static async getProfile(userId) {
        const user = await prisma.usuario.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            data_nascimento: user.data_nascimento,
            idade: calcularIdade(user.data_nascimento),
            telefone: user.telefone,
            genero: user.genero
        };
    }

    static async updateProfile(userId, { nome, data_nascimento, telefone, genero }) {
        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (data_nascimento !== undefined) updateData.data_nascimento = new Date(data_nascimento);
        if (telefone !== undefined) updateData.telefone = telefone;
        if (genero !== undefined) updateData.genero = genero;

        if (Object.keys(updateData).length === 0) {
            throw new Error('Nenhum campo fornecido para atualização.');
        }

        const updatedUser = await prisma.usuario.update({
            where: { id: userId },
            data: updateData
        });

        return {
            id: updatedUser.id,
            nome: updatedUser.nome,
            email: updatedUser.email,
            idade: calcularIdade(updatedUser.data_nascimento),
            telefone: updatedUser.telefone,
            genero: updatedUser.genero
        };
    }
}
