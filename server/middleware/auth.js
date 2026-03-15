import User from '../models/User.js';

function parseCookies(header = '') {
    return header
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((acc, part) => {
            const separatorIndex = part.indexOf('=');
            if (separatorIndex === -1) {
                return acc;
            }

            const key = part.slice(0, separatorIndex).trim();
            const value = part.slice(separatorIndex + 1).trim();
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
}

export function getSessionTokenFromRequest(req) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    const cookies = parseCookies(req.headers.cookie || '');
    if (cookies.mytrip_session) {
        return cookies.mytrip_session;
    }

    if (req.query.token) {
        return Array.isArray(req.query.token) ? req.query.token[0] : String(req.query.token);
    }

    return '';
}

export async function auth(req, res, next) {
    const token = getSessionTokenFromRequest(req);

    if (!token) return res.sendStatus(401);

    const user = await User.findOne({ sessionToken: token, sessionExpiresAt: { $gt: new Date() } });
    if (!user) return res.sendStatus(401);

    req.user = user;
    return next();
}
