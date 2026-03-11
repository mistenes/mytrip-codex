import express from 'express';
import fs from 'fs';
import path from 'path';

import Document from '../models/Document.js';
import Trip from '../models/Trip.js';
import { auth } from '../middleware/auth.js';
import { upload, uploadDir } from '../middleware/upload.js';
import { buildTripAccessFilter, canAccessTrip, isTripManager, isTraveler } from '../utils/accessControl.js';

const router = express.Router();

function serializeDocument(document) {
    return {
        id: String(document._id),
        tripId: String(document.tripId),
        name: document.name,
        category: document.category,
        uploadDate: document.uploadDate,
        fileName: document.filename,
        visibleTo: Array.isArray(document.visibleTo) ? document.visibleTo.map((id) => String(id)) : document.visibleTo,
        uploadedBy: String(document.userId || ''),
    };
}

function getParticipantIds(trip) {
    return new Set([
        ...(trip.organizerIds || []).map((id) => String(id)),
        ...(trip.travelerIds || []).map((id) => String(id)),
    ]);
}

function normalizeVisibleTo(rawValue, trip) {
    if (!rawValue) {
        return 'all';
    }

    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (parsed === 'all') {
        return 'all';
    }

    if (!Array.isArray(parsed)) {
        throw new Error('invalid_visible_to');
    }

    const participantIds = getParticipantIds(trip);
    const normalized = [...new Set(parsed.map(String))];

    if (!normalized.every((id) => participantIds.has(id))) {
        throw new Error('invalid_visible_to');
    }

    return normalized;
}

router.get('/documents', auth, async (req, res) => {
    const trips = await Trip.find(buildTripAccessFilter(req.user), '_id').lean();
    const tripIds = trips.map((trip) => trip._id);

    if (tripIds.length === 0) {
        return res.json([]);
    }

    const documents = await Document.find({ tripId: { $in: tripIds } })
        .sort({ uploadDate: -1, createdAt: -1 })
        .lean();

    let filteredDocuments = documents;
    if (isTraveler(req.user)) {
        filteredDocuments = filteredDocuments.filter((document) =>
            document.visibleTo === 'all' ||
            (Array.isArray(document.visibleTo) && document.visibleTo.some((id) => String(id) === String(req.user._id)))
        );
    }

    if (req.query.userId) {
        filteredDocuments = filteredDocuments.filter((document) => String(document.userId) === String(req.query.userId));
    }

    return res.json(filteredDocuments.map(serializeDocument));
});

router.post('/trips/:tripId/documents', auth, upload.single('file'), async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }
    if (!req.file) {
        return res.status(400).json({ message: 'File required' });
    }

    let visibleTo = 'all';
    try {
        visibleTo = normalizeVisibleTo(req.body.visibleTo, trip);
    } catch (_) {
        return res.status(400).json({ message: 'Invalid visibility selection' });
    }

    const document = await Document.create({
        tripId: trip._id,
        userId: req.user._id,
        name: String(req.body.name || req.file.originalname).trim(),
        category: String(req.body.category || '').trim(),
        filename: req.file.filename,
        uploadDate: new Date().toISOString().split('T')[0],
        visibleTo,
    });

    return res.status(201).json(serializeDocument(document));
});

router.put('/documents/:id', auth, upload.single('file'), async (req, res) => {
    const document = await Document.findById(req.params.id);
    if (!document) {
        return res.sendStatus(404);
    }

    const trip = await Trip.findById(document.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    if (typeof req.body.visibleTo !== 'undefined') {
        try {
            document.visibleTo = normalizeVisibleTo(req.body.visibleTo, trip);
        } catch (_) {
            return res.status(400).json({ message: 'Invalid visibility selection' });
        }
    }

    if (typeof req.body.name === 'string') {
        document.name = req.body.name.trim();
    }
    if (typeof req.body.category === 'string') {
        document.category = req.body.category.trim();
    }

    if (req.file) {
        if (document.filename) {
            try {
                await fs.promises.unlink(path.join(uploadDir, document.filename));
            } catch (_) {
            }
        }
        document.filename = req.file.filename;
    }

    await document.save();
    return res.json(serializeDocument(document));
});

router.delete('/documents/:id', auth, async (req, res) => {
    const document = await Document.findById(req.params.id);
    if (!document) {
        return res.sendStatus(404);
    }

    const trip = await Trip.findById(document.tripId);
    if (!trip) {
        return res.sendStatus(404);
    }
    if (!isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    if (document.filename) {
        try {
            await fs.promises.unlink(path.join(uploadDir, document.filename));
        } catch (_) {
        }
    }

    await document.deleteOne();
    return res.sendStatus(204);
});

router.get('/documents/:id/file', auth, async (req, res) => {
    const document = await Document.findById(req.params.id).lean();
    if (!document) {
        return res.sendStatus(404);
    }

    const trip = await Trip.findById(document.tripId);
    if (!trip || !(await canAccessTrip(req.user, trip))) {
        return res.sendStatus(403);
    }

    if (isTraveler(req.user)) {
        const isVisible = document.visibleTo === 'all' ||
            (Array.isArray(document.visibleTo) && document.visibleTo.some((id) => String(id) === String(req.user._id)));

        if (!isVisible) {
            return res.sendStatus(403);
        }
    }

    return res.sendFile(path.join(uploadDir, document.filename));
});

export default router;
