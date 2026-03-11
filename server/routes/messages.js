import express from 'express';

import Message from '../models/Message.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { buildTripAccessFilter, canAccessTrip, isTripManager, isTraveler } from '../utils/accessControl.js';
import { sendMessageEmail } from '../utils/email.js';

const router = express.Router();

function serializeMessage(message) {
    return {
        id: String(message._id),
        tripId: String(message.tripId),
        authorId: String(message.authorId),
        recipientIds: (message.recipientIds || []).map((id) => String(id)),
        content: message.content,
        createdAt: message.createdAt,
        readBy: (message.readBy || []).map((id) => String(id)),
    };
}

function getParticipantIds(trip) {
    return new Set([
        ...(trip.organizerIds || []).map((id) => String(id)),
        ...(trip.travelerIds || []).map((id) => String(id)),
    ]);
}

function normalizeRecipients(recipientIds, trip) {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        throw new Error('invalid_recipients');
    }

    const participantIds = getParticipantIds(trip);
    const normalized = [...new Set(recipientIds.map(String))];

    if (!normalized.every((id) => participantIds.has(id))) {
        throw new Error('invalid_recipients');
    }

    return normalized;
}

router.get('/messages', auth, async (req, res) => {
    const trips = await Trip.find(buildTripAccessFilter(req.user), '_id').lean();
    const tripIds = trips.map((trip) => trip._id);

    if (tripIds.length === 0) {
        return res.json([]);
    }

    const query = { tripId: { $in: tripIds } };
    if (isTraveler(req.user)) {
        query.recipientIds = req.user._id;
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).lean();
    return res.json(messages.map(serializeMessage));
});

router.post('/trips/:tripId/messages', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    const content = String(req.body.content || '').trim();
    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    let recipientIds;
    try {
        recipientIds = normalizeRecipients(req.body.recipientIds, trip);
    } catch (_) {
        return res.status(400).json({ message: 'Invalid recipient list' });
    }

    const message = await Message.create({
        tripId: trip._id,
        authorId: req.user._id,
        recipientIds,
        content,
        readBy: [req.user._id],
    });

    const recipients = await User.find(
        {
            _id: { $in: recipientIds },
            email: { $exists: true, $ne: '' },
        },
        'firstName lastName name email'
    ).lean();

    await Promise.all(recipients.map((recipient) => sendMessageEmail(recipient, content)));
    return res.status(201).json(serializeMessage(message));
});

router.put('/trips/:tripId/messages/:id', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    const message = await Message.findById(req.params.id);
    if (!message || String(message.tripId) !== String(trip._id)) {
        return res.sendStatus(404);
    }

    const content = String(req.body.content || '').trim();
    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    let recipientIds;
    try {
        recipientIds = normalizeRecipients(req.body.recipientIds, trip);
    } catch (_) {
        return res.status(400).json({ message: 'Invalid recipient list' });
    }

    message.content = content;
    message.recipientIds = recipientIds;
    message.readBy = [req.user._id];
    await message.save();

    return res.json(serializeMessage(message));
});

router.delete('/trips/:tripId/messages/:id', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    await Message.deleteOne({ _id: req.params.id, tripId: req.params.tripId });
    return res.json({ message: 'ok' });
});

router.post('/messages/:id/read', auth, async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) {
        return res.sendStatus(404);
    }
    if (!(await canAccessTrip(req.user, message.tripId))) {
        return res.sendStatus(403);
    }
    if (isTraveler(req.user) && !(message.recipientIds || []).some((id) => String(id) === String(req.user._id))) {
        return res.sendStatus(403);
    }

    await Message.updateOne({ _id: message._id }, { $addToSet: { readBy: req.user._id } });
    return res.json({ message: 'ok' });
});

export default router;
