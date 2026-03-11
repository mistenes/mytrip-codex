import express from 'express';
import { v2 as cloudinary } from 'cloudinary';

import SiteSettings from '../models/SiteSettings.js';
import { auth } from '../middleware/auth.js';
import { isAdmin } from '../utils/accessControl.js';

const router = express.Router();

async function getSiteSettings() {
    const settings = await SiteSettings.findOne({}).lean();
    return settings || { logoLight: '', logoDark: '', loginBackground: '' };
}

router.get('/settings/logo', async (_req, res) => {
    const settings = await getSiteSettings();
    return res.json({
        logoLight: settings.logoLight || '',
        logoDark: settings.logoDark || '',
        loginBackground: settings.loginBackground || '',
    });
});

router.put('/settings/logo', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const settings = await SiteSettings.findOneAndUpdate(
        {},
        {
            logoLight: String(req.body.logoLight || '').trim(),
            logoDark: String(req.body.logoDark || '').trim(),
            loginBackground: String(req.body.loginBackground || '').trim(),
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    ).lean();

    return res.json({
        logoLight: settings.logoLight || '',
        logoDark: settings.logoDark || '',
        loginBackground: settings.loginBackground || '',
    });
});

router.get('/cloudinary-signature', auth, (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        return res.status(503).json({ message: 'Cloudinary is not configured' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, source: 'media_library' },
        process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
        timestamp,
        signature,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
    });
});

export default router;
