import express from 'express';
import crypto from 'crypto';

import Invitation from '../models/Invitation.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { sendInvitationEmail } from '../utils/email.js';
import { buildAppUrl } from '../utils/request.js';
import { buildManagedTripFilter, isAdmin, isOrganizer, isTripManager } from '../utils/accessControl.js';

const router = express.Router();

function serializeInvitation(invitation) {
    return {
        _id: String(invitation._id),
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        name: invitation.name,
        role: invitation.role,
        tripId: invitation.tripId ? String(invitation.tripId) : '',
        expiresAt: invitation.expiresAt,
        used: invitation.used,
    };
}

async function getManagedTripIds(user) {
    if (isAdmin(user)) {
        const trips = await Trip.find({}, '_id').lean();
        return trips.map((trip) => String(trip._id));
    }

    if (!isOrganizer(user)) {
        return [];
    }

    const trips = await Trip.find(buildManagedTripFilter(user), '_id').lean();
    return trips.map((trip) => String(trip._id));
}

function canManageInvitation(user, invitation, managedTripIds) {
    if (isAdmin(user)) return true;
    if (!isOrganizer(user)) return false;
    return invitation.role === 'traveler' && managedTripIds.includes(String(invitation.tripId || ''));
}

router.post('/invitations', auth, async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const role = String(req.body.role || '').trim();
    const tripId = String(req.body.tripId || '').trim();

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, first name, and last name are required' });
    }

    if (!['organizer', 'traveler'].includes(role)) {
        return res.status(400).json({ message: 'Invalid invitation role' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    if (role === 'organizer' && !isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    let trip = null;
    if (tripId) {
        trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
    }

    if (isOrganizer(req.user)) {
        if (!trip || !isTripManager(req.user, trip) || role !== 'traveler') {
            return res.sendStatus(403);
        }
    }

    const [existingInvite, existingUser] = await Promise.all([
        Invitation.findOne({
            email,
            used: false,
            expiresAt: { $gt: new Date() },
        }),
        User.findOne({ email }),
    ]);

    if (existingInvite) {
        return res.status(409).json({ message: 'Invitation already sent' });
    }

    if (existingUser) {
        return res.status(409).json({ message: 'A user with this email address already exists' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();

    const invite = await Invitation.create({
        email,
        firstName,
        lastName,
        name,
        role,
        tripId: trip ? trip._id : undefined,
        token,
        expiresAt,
    });

    const signupUrl = buildAppUrl(req, `/signup?token=${token}`);
    await sendInvitationEmail(email, signupUrl, name, trip?.name || '', role);

    return res.status(201).json({ message: 'Invitation sent', id: String(invite._id) });
});

router.get('/invitations', auth, async (req, res) => {
    if (req.user.role === 'traveler') {
        return res.sendStatus(403);
    }

    const invitations = await Invitation.find({
        used: false,
        expiresAt: { $gt: new Date() },
    }).lean();

    if (isAdmin(req.user)) {
        return res.json(invitations.map(serializeInvitation));
    }

    const managedTripIds = await getManagedTripIds(req.user);
    return res.json(
        invitations
            .filter((invitation) => canManageInvitation(req.user, invitation, managedTripIds))
            .map(serializeInvitation)
    );
});

router.get('/trips/:tripId/invitations', auth, async (req, res) => {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip || !isTripManager(req.user, trip)) {
        return res.sendStatus(403);
    }

    const invitations = await Invitation.find({
        tripId: req.params.tripId,
        role: 'traveler',
        used: false,
        expiresAt: { $gt: new Date() },
    }).lean();

    return res.json(invitations.map(serializeInvitation));
});

router.post('/invitations/:id/resend', auth, async (req, res) => {
    const invite = await Invitation.findById(req.params.id);
    if (!invite || invite.used) return res.sendStatus(404);

    const managedTripIds = await getManagedTripIds(req.user);
    if (!canManageInvitation(req.user, invite, managedTripIds)) {
        return res.sendStatus(403);
    }

    invite.token = crypto.randomBytes(32).toString('hex');
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invite.save();

    const trip = invite.tripId ? await Trip.findById(invite.tripId) : null;
    const signupUrl = buildAppUrl(req, `/signup?token=${invite.token}`);
    await sendInvitationEmail(invite.email, signupUrl, invite.name, trip?.name || '', invite.role);

    return res.json({ message: 'Invitation resent' });
});

router.delete('/invitations/:id', auth, async (req, res) => {
    const invite = await Invitation.findById(req.params.id);
    if (!invite) return res.sendStatus(404);

    const managedTripIds = await getManagedTripIds(req.user);
    if (!canManageInvitation(req.user, invite, managedTripIds)) {
        return res.sendStatus(403);
    }

    await invite.deleteOne();
    return res.sendStatus(204);
});

router.get('/invitations/:token', async (req, res) => {
    const invitation = await Invitation.findOne({
        token: req.params.token,
        used: false,
        expiresAt: { $gt: new Date() },
    });

    if (!invitation) return res.sendStatus(404);

    return res.json({
        email: invitation.email,
        role: invitation.role,
        tripId: invitation.tripId ? String(invitation.tripId) : '',
    });
});

export default router;
