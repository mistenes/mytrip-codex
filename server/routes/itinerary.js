import express from 'express';

import ItineraryItem from '../models/ItineraryItem.js';
import Trip from '../models/Trip.js';
import { auth } from '../middleware/auth.js';
import { buildTripAccessFilter, isTripManager } from '../utils/accessControl.js';

const router = express.Router();

function serializeItem(item) {
    return {
        id: String(item._id),
        tripId: String(item.tripId),
        title: item.title,
        description: item.description,
        startDateTimeLocal: item.startDateTimeLocal,
        endDateTimeLocal: item.endDateTimeLocal,
        location: item.location,
        timeZone: item.timeZone,
        programType: item.programType || 'required',
    };
}

router.get('/itinerary', auth, async (req, res) => {
    const trips = await Trip.find(buildTripAccessFilter(req.user), '_id').lean();
    const tripIds = trips.map((trip) => trip._id);

    if (tripIds.length === 0) {
        return res.json([]);
    }

    const items = await ItineraryItem.find({ tripId: { $in: tripIds } }).sort({ startDateTimeLocal: 1 }).lean();
    return res.json(items.map(serializeItem));
});

router.post('/trips/:tripId/itinerary', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    const title = String(req.body.title || '').trim();
    const startDateTimeLocal = String(req.body.startDateTimeLocal || '').trim();
    const timeZone = String(req.body.timeZone || '').trim();

    if (!title || !startDateTimeLocal || !timeZone) {
        return res.status(400).json({ message: 'Title, start date, and time zone are required' });
    }

    const item = await ItineraryItem.create({
        tripId: trip._id,
        title,
        description: String(req.body.description || '').trim(),
        startDateTimeLocal,
        endDateTimeLocal: String(req.body.endDateTimeLocal || '').trim(),
        location: String(req.body.location || '').trim(),
        timeZone,
        programType: String(req.body.programType || 'required').trim() || 'required',
    });

    return res.status(201).json(serializeItem(item));
});

router.put('/itinerary/:id', auth, async (req, res) => {
    const item = await ItineraryItem.findById(req.params.id);
    if (!item) {
        return res.sendStatus(404);
    }

    const trip = await Trip.findById(item.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    if (typeof req.body.title === 'string') {
        item.title = req.body.title.trim();
    }
    if (typeof req.body.description === 'string') {
        item.description = req.body.description.trim();
    }
    if (typeof req.body.startDateTimeLocal === 'string') {
        item.startDateTimeLocal = req.body.startDateTimeLocal.trim();
    }
    if (typeof req.body.endDateTimeLocal === 'string') {
        item.endDateTimeLocal = req.body.endDateTimeLocal.trim();
    }
    if (typeof req.body.location === 'string') {
        item.location = req.body.location.trim();
    }
    if (typeof req.body.timeZone === 'string') {
        item.timeZone = req.body.timeZone.trim();
    }
    if (typeof req.body.programType === 'string' && req.body.programType.trim()) {
        item.programType = req.body.programType.trim();
    }

    if (!item.title || !item.startDateTimeLocal || !item.timeZone) {
        return res.status(400).json({ message: 'Title, start date, and time zone are required' });
    }

    await item.save();
    return res.json(serializeItem(item));
});

router.delete('/itinerary/:id', auth, async (req, res) => {
    const item = await ItineraryItem.findById(req.params.id);
    if (!item) {
        return res.sendStatus(404);
    }

    const trip = await Trip.findById(item.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    await item.deleteOne();
    return res.sendStatus(204);
});

export default router;
