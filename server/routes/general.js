import express from 'express';

import FieldConfig from '../models/FieldConfig.js';
import Trip from '../models/Trip.js';
import { auth } from '../middleware/auth.js';
import { sendProblemReportEmail } from '../utils/email.js';
import { buildTripAccessFilter, isAdmin, isTripManager } from '../utils/accessControl.js';

const router = express.Router();

router.get('/health', (_req, res) => {
    return res.json({ status: 'ok', service: 'myTrip', database: 'supabase-postgres' });
});

router.post('/report-problem', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    await sendProblemReportEmail(name, email, message);
    return res.json({ message: 'Report sent' });
});

router.get('/field-config', auth, async (req, res) => {
    if (isAdmin(req.user)) {
        const configs = await FieldConfig.find().sort({ order: 1 }).lean();
        return res.json(configs);
    }

    const trips = await Trip.find(buildTripAccessFilter(req.user), '_id').lean();
    const tripIds = trips.map((trip) => String(trip._id));
    const configs = await FieldConfig.find({
        $or: [
            { tripId: 'default' },
            { tripId: { $in: tripIds } },
        ],
    }).sort({ order: 1 }).lean();

    return res.json(configs);
});

router.put('/field-config/:field', auth, async (req, res) => {
    const tripId = String(req.body.tripId || '').trim();
    if (!tripId) {
        return res.status(400).json({ message: 'tripId is required' });
    }

    if (tripId === 'default') {
        if (!isAdmin(req.user)) {
            return res.sendStatus(403);
        }
    } else {
        const trip = await Trip.findById(tripId);
        if (!trip || !isTripManager(req.user, trip)) {
            return res.sendStatus(403);
        }
    }

    const options = Array.isArray(req.body.options)
        ? req.body.options.map((option) => String(option).trim()).filter(Boolean)
        : [];

    const config = await FieldConfig.findOneAndUpdate(
        { field: req.params.field, tripId },
        {
            field: req.params.field,
            tripId,
            label: String(req.body.label || '').trim(),
            type: String(req.body.type || 'text').trim(),
            enabled: req.body.enabled !== false,
            locked: !!req.body.locked,
            order: Number(req.body.order || 0),
            options,
            section: String(req.body.section || 'general').trim(),
        },
        { new: true, upsert: true }
    );

    return res.json(config);
});

router.delete('/field-config/:field', auth, async (req, res) => {
    const tripId = String(req.query.tripId || '').trim();
    if (!tripId) {
        return res.status(400).json({ message: 'tripId required' });
    }

    if (tripId === 'default') {
        if (!isAdmin(req.user)) {
            return res.sendStatus(403);
        }
    } else {
        const trip = await Trip.findById(tripId);
        if (!trip || !isTripManager(req.user, trip)) {
            return res.sendStatus(403);
        }
    }

    await FieldConfig.deleteOne({ field: req.params.field, tripId });
    return res.sendStatus(204);
});

export default router;
