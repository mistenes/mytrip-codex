import User from '../models/User.js';

export async function auth(req, res, next) {
    let token = '';
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    } else if (req.query.token) {
        token = Array.isArray(req.query.token) ? req.query.token[0] : String(req.query.token);
    }

    if (!token) return res.sendStatus(401);

    const user = await User.findOne({ sessionToken: token, sessionExpiresAt: { $gt: new Date() } });
    if (!user) return res.sendStatus(401);

    req.user = user;
    return next();
}
