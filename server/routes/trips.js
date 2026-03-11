import express from 'express';
import fs from 'fs';
import path from 'path';

import Trip from '../models/Trip.js';
import User from '../models/User.js';
import FieldConfig from '../models/FieldConfig.js';
import Invitation from '../models/Invitation.js';
import Document from '../models/Document.js';
import FinancialRecord from '../models/FinancialRecord.js';
import ItineraryItem from '../models/ItineraryItem.js';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';
import { uploadDir } from '../middleware/upload.js';
import { buildTripAccessFilter, isAdmin, isTripManager } from '../utils/accessControl.js';

const router = express.Router();

async function serializeTrips(trips) {
    const plainTrips = trips.map((trip) => (typeof trip.toObject === 'function' ? trip.toObject() : trip));
    const allOrganizerIds = [...new Set(
        plainTrips.flatMap((trip) => (trip.organizerIds || []).map((id) => id.toString()))
    )];

    const organizers = await User.find(
        { _id: { $in: allOrganizerIds } },
        'firstName lastName name contactPhone contactEmail contactTitle contactShowEmergency'
    ).lean();

    const nameMap = Object.fromEntries(organizers.map((organizer) => [organizer._id.toString(), organizer.name]));
    const organizerDetailMap = Object.fromEntries(organizers.map((organizer) => [organizer._id.toString(), organizer]));

    return plainTrips.map((trip) => {
        const organizerIds = (trip.organizerIds || []).map((id) => id.toString());
        const travelerIds = (trip.travelerIds || []).map((id) => id.toString());

        const emergencyContacts = organizerIds
            .map((id) => {
                const details = organizerDetailMap[id];
                if (!details || !details.contactShowEmergency) return null;
                return {
                    id,
                    firstName: details.firstName || '',
                    lastName: details.lastName || '',
                    name: details.name || '',
                    contactTitle: details.contactTitle || '',
                    contactPhone: details.contactPhone || '',
                    contactEmail: details.contactEmail || '',
                };
            })
            .filter(Boolean);

        return {
            ...trip,
            _id: String(trip._id),
            organizerIds,
            travelerIds,
            organizerNames: organizerIds.map((id) => nameMap[id] || ''),
            emergencyContacts,
        };
    });
}

router.get('/trips', auth, async (req, res) => {
    const trips = await Trip.find(buildTripAccessFilter(req.user)).lean();
    return res.json(await serializeTrips(trips));
});

router.post('/trips', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const name = String(req.body.name || '').trim();
    const startDate = String(req.body.startDate || '').trim();
    const endDate = String(req.body.endDate || '').trim();
    const organizerIds = Array.isArray(req.body.organizerIds) ? [...new Set(req.body.organizerIds.map(String))] : [];
    const travelerIds = Array.isArray(req.body.travelerIds) ? [...new Set(req.body.travelerIds.map(String))] : [];

    if (!name || !startDate || !endDate || organizerIds.length === 0) {
        return res.status(400).json({ message: 'Trip name, dates, and at least one organizer are required' });
    }

    const organizerCount = await User.countDocuments({
        _id: { $in: organizerIds },
        role: { $in: ['admin', 'organizer'] },
    });

    if (organizerCount !== organizerIds.length) {
        return res.status(400).json({ message: 'Every organizer must be an existing organizer account' });
    }

    const trip = new Trip({ name, startDate, endDate, organizerIds, travelerIds });
    await trip.save();

    const defaults = await FieldConfig.find({ tripId: 'default' }).lean();
    if (defaults.length > 0) {
        await FieldConfig.insertMany(defaults.map(({ _id, createdAt, updatedAt, ...config }) => ({
            ...config,
            tripId: String(trip._id),
        })));
    }

    return res.status(201).json(trip);
});

router.put('/trips/:id', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    trip.name = String(req.body.name || trip.name).trim();
    trip.startDate = String(req.body.startDate || trip.startDate).trim();
    trip.endDate = String(req.body.endDate || trip.endDate).trim();
    await trip.save();

    return res.json(trip);
});

router.post('/trips/:id/organizers', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);

    const userId = String(req.body.userId || '').trim();
    const organizer = await User.findOne({ _id: userId, role: { $in: ['admin', 'organizer'] } });
    if (!organizer) {
        return res.status(400).json({ message: 'Organizer not found' });
    }

    await Trip.findByIdAndUpdate(req.params.id, { $addToSet: { organizerIds: userId } });
    return res.sendStatus(204);
});

router.delete('/trips/:id/organizers/:userId', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    if ((trip.organizerIds || []).length <= 1) {
        return res.status(400).json({ message: 'Trip must retain at least one organizer' });
    }

    await Trip.findByIdAndUpdate(req.params.id, { $pull: { organizerIds: req.params.userId } });
    return res.sendStatus(204);
});

router.post('/trips/:id/travelers', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    const userId = String(req.body.userId || '').trim();
    const traveler = await User.findOne({ _id: userId, role: 'traveler' });
    if (!traveler) {
        return res.status(400).json({ message: 'Traveler not found' });
    }

    await Trip.findByIdAndUpdate(req.params.id, { $addToSet: { travelerIds: userId } });
    return res.sendStatus(204);
});

router.delete('/trips/:id/travelers/:userId', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    await Trip.findByIdAndUpdate(req.params.id, { $pull: { travelerIds: req.params.userId } });
    return res.sendStatus(204);
});

router.delete('/trips/:id', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.sendStatus(404);
    if (!isTripManager(req.user, trip)) return res.sendStatus(403);

    const documents = await Document.find({ tripId: trip._id }, 'filename').lean();
    await Promise.all(documents.map(async (document) => {
        if (!document.filename) return;
        try {
            await fs.promises.unlink(path.join(uploadDir, document.filename));
        } catch (_) {
        }
    }));

    await Promise.all([
        Trip.findByIdAndDelete(req.params.id),
        FieldConfig.deleteMany({ tripId: req.params.id }),
        Invitation.deleteMany({ tripId: req.params.id }),
        Document.deleteMany({ tripId: req.params.id }),
        FinancialRecord.deleteMany({ tripId: req.params.id }),
        ItineraryItem.deleteMany({ tripId: req.params.id }),
        Message.deleteMany({ tripId: req.params.id }),
    ]);

    return res.sendStatus(204);
});

export default router;
