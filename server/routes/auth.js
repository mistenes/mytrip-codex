import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Trip from '../models/Trip.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { buildAppUrl } from '../utils/request.js';
import { getSessionTokenFromRequest } from '../middleware/auth.js';

const router = express.Router();
const SESSION_COOKIE_NAME = 'mytrip_session';

function getSessionCookieOptions(req) {
    const forwardedProto = req.get('x-forwarded-proto');
    const isSecure = req.secure || forwardedProto === 'https' || process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
        maxAge: 4 * 60 * 60 * 1000,
    };
}

function isBcryptHash(value = '') {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

function serializeUser(user) {
    return {
        id: String(user._id),
        role: user.role,
        name: user.name || user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactPhone: user.contactPhone,
        contactEmail: user.contactEmail,
        contactTitle: user.contactTitle,
        contactShowEmergency: user.contactShowEmergency,
        mustChangePassword: user.mustChangePassword,
        themePreference: user.themePreference || 'auto',
        betaBannerDismissed: !!user.betaBannerDismissed,
    };
}

router.post('/login', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    let valid = false;
    if (isBcryptHash(user.passwordHash || '')) {
        valid = await bcrypt.compare(password, user.passwordHash);
    } else {
        const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.passwordHash === legacyHash) {
            valid = true;
            user.passwordHash = await bcrypt.hash(password, 10);
            await user.save();
        }
    }

    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = crypto.randomBytes(32).toString('hex');
    user.sessionToken = token;
    user.sessionExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    await user.save();

    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions(req));
    return res.json(serializeUser(user));
});

router.post('/logout', async (req, res) => {
    const token = getSessionTokenFromRequest(req);
    if (token) {
        await User.updateOne({ sessionToken: token }, { $unset: { sessionToken: 1, sessionExpiresAt: 1 } });
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.sendStatus(204);
});

router.get('/session', async (req, res) => {
    const token = getSessionTokenFromRequest(req);
    if (!token) return res.sendStatus(401);

    const user = await User.findOne({ sessionToken: token, sessionExpiresAt: { $gt: new Date() } });
    if (!user) return res.sendStatus(401);

    return res.json(serializeUser(user));
});

router.post('/forgot-password', async (req, res) => {
    const identifier = String(req.body.identifier || '').trim();

    if (identifier) {
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier },
            ],
        });

        if (user?.email) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetToken = token;
            user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
            await user.save();

            const resetUrl = buildAppUrl(req, `/reset-password?token=${token}`);
            await sendPasswordResetEmail(user.email, resetUrl);
        }
    }

    return res.json({ message: 'If the account exists, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');

    if (!token || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ resetToken: token, resetTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: 'Password updated' });
});

router.post('/register/:token', async (req, res) => {
    const invitation = await Invitation.findOne({
        token: req.params.token,
        used: false,
        expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
        return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const username = String(req.body.username || '').trim();
    const dateOfBirth = String(req.body.dateOfBirth || '').trim();
    const password = String(req.body.password || '');
    const verifyPassword = String(req.body.verifyPassword || '');

    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        return res.status(400).json({ message: 'Names may only contain English letters, spaces, hyphens, and apostrophes' });
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: 'Username must contain only English letters, numbers, or underscores' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return res.status(400).json({ message: 'Date of birth must be in YYYY-MM-DD format' });
    }

    if (password.length < 8 || password !== verifyPassword) {
        return res.status(400).json({ message: 'Passwords must match and be at least 8 characters' });
    }

    const [existingUsername, existingEmail] = await Promise.all([
        User.findOne({ username }),
        User.findOne({ email: invitation.email.toLowerCase() }),
    ]);

    if (existingUsername) {
        return res.status(409).json({ message: 'Username already in use' });
    }

    if (existingEmail) {
        return res.status(409).json({ message: 'An account already exists for this email address' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        username,
        dateOfBirth,
        email: invitation.email.toLowerCase(),
        passwordHash,
        role: invitation.role,
        personalData: [
            { field: 'firstName', value: firstName, locked: true },
            { field: 'lastName', value: lastName, locked: true },
            { field: 'dateOfBirth', value: dateOfBirth, locked: true },
        ],
    });

    await user.save();

    if (invitation.tripId) {
        if (invitation.role === 'organizer') {
            await Trip.findByIdAndUpdate(invitation.tripId, { $addToSet: { organizerIds: user._id } });
        } else if (invitation.role === 'traveler') {
            await Trip.findByIdAndUpdate(invitation.tripId, { $addToSet: { travelerIds: user._id } });
        }
    }

    invitation.used = true;
    await invitation.save();

    return res.status(201).json({ id: String(user._id), email: user.email });
});

export default router;
