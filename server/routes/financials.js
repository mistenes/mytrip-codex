import express from 'express';

import FinancialRecord from '../models/FinancialRecord.js';
import Trip from '../models/Trip.js';
import { auth } from '../middleware/auth.js';
import { buildTripAccessFilter, isTripManager, isTraveler } from '../utils/accessControl.js';

const router = express.Router();

function serializeRecord(record) {
    return {
        id: String(record._id),
        tripId: String(record.tripId),
        userId: String(record.userId),
        description: record.description,
        amount: record.amount,
        date: record.date,
    };
}

function getParticipantIds(trip) {
    return new Set([
        ...(trip.organizerIds || []).map((id) => String(id)),
        ...(trip.travelerIds || []).map((id) => String(id)),
    ]);
}

router.get('/financials', auth, async (req, res) => {
    const trips = await Trip.find(buildTripAccessFilter(req.user), '_id').lean();
    const tripIds = trips.map((trip) => trip._id);

    const query = { tripId: { $in: tripIds } };
    if (isTraveler(req.user)) {
        query.userId = req.user._id;
    }

    const records = await FinancialRecord.find(query).lean();
    return res.json(records.map(serializeRecord));
});

router.post('/trips/:tripId/financials', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    const userId = String(req.body.userId || '').trim();
    const description = String(req.body.description || '').trim();
    const date = String(req.body.date || '').trim();
    const amount = Number(req.body.amount);

    if (!userId || !description || !date || Number.isNaN(amount)) {
        return res.status(400).json({ message: 'User, description, date, and a valid amount are required' });
    }

    const participantIds = getParticipantIds(trip);
    if (!participantIds.has(userId)) {
        return res.status(400).json({ message: 'A kiválasztott felhasználó nincs hozzárendelve az utazáshoz.' });
    }

    const record = await FinancialRecord.create({
        tripId: trip._id,
        userId,
        description,
        amount,
        date,
    });

    return res.status(201).json(serializeRecord(record));
});

router.put('/financials/:id', auth, async (req, res) => {
    const record = await FinancialRecord.findById(req.params.id);
    if (!record) return res.sendStatus(404);

    const trip = await Trip.findById(record.tripId);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    if (req.body.userId) {
        const participantIds = getParticipantIds(trip);
        if (!participantIds.has(String(req.body.userId))) {
            return res.status(400).json({ message: 'A kiválasztott felhasználó nincs hozzárendelve az utazáshoz.' });
        }
        record.userId = req.body.userId;
    }

    if (typeof req.body.description === 'string') {
        record.description = req.body.description.trim();
    }

    if (typeof req.body.date === 'string') {
        record.date = req.body.date.trim();
    }

    if (typeof req.body.amount !== 'undefined') {
        const amountNumber = Number(req.body.amount);
        if (Number.isNaN(amountNumber)) {
            return res.status(400).json({ message: 'Érvénytelen összeg.' });
        }
        record.amount = amountNumber;
    }

    await record.save();
    return res.json(serializeRecord(record));
});

router.delete('/financials/:id', auth, async (req, res) => {
    const record = await FinancialRecord.findById(req.params.id);
    if (!record) return res.sendStatus(404);

    const trip = await Trip.findById(record.tripId);
    if (!trip || !isTripManager(req.user, trip)) return res.sendStatus(403);

    await record.deleteOne();
    return res.sendStatus(204);
});

export default router;
