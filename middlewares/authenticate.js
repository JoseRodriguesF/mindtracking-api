import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_KEY;

const parseCookies = (cookieHeader) => {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        let [name, ...rest] = cookie.split('=');
        name = name.trim();
        if (!name) return;
        const val = rest.join('=').trim();
        list[name] = decodeURIComponent(val);
    });
    return list;
};

export function authenticate(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: 'Token não fornecido' });
    }

    // Verificar o token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }

        req.user = decoded; // Armazenar as informações do usuário decodificadas no request
        return next(); // Passar o controle para a próxima função
    });
}

export default authenticate;