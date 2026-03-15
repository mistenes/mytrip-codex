import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import User from '../models/User.js';
import Trip from '../models/Trip.js';
import FieldConfig from '../models/FieldConfig.js';
import { auth } from '../middleware/auth.js';
import { upload, uploadDir } from '../middleware/upload.js';
import { buildManagedTripFilter, isAdmin, isOrganizer } from '../utils/accessControl.js';

const router = express.Router();

function isBcryptHash(value = '') {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

function serializeUser(user, includePersonalData = false) {
    const plainUser = typeof user.toObject === 'function' ? user.toObject() : user;

    return {
        _id: String(plainUser._id),
        id: String(plainUser._id),
        firstName: plainUser.firstName,
        lastName: plainUser.lastName,
        name: plainUser.name || [plainUser.firstName, plainUser.lastName].filter(Boolean).join(' ').trim() || plainUser.username,
        username: plainUser.username,
        dateOfBirth: plainUser.dateOfBirth,
        email: plainUser.email,
        contactPhone: plainUser.contactPhone,
        contactEmail: plainUser.contactEmail,
        contactTitle: plainUser.contactTitle,
        contactShowEmergency: !!plainUser.contactShowEmergency,
        role: plainUser.role,
        mustChangePassword: !!plainUser.mustChangePassword,
        themePreference: plainUser.themePreference || 'auto',
        betaBannerDismissed: !!plainUser.betaBannerDismissed,
        passportPhoto: plainUser.passportPhoto || '',
        personalData: includePersonalData ? (Array.isArray(plainUser.personalData) ? plainUser.personalData : []) : [],
    };
}

async function getManagedUserIds(user) {
    if (!user) {
        return new Set();
    }

    const managedTrips = await Trip.find(buildManagedTripFilter(user), 'organizerIds travelerIds').lean();
    const ids = new Set([String(user._id)]);

    managedTrips.forEach((trip) => {
        (trip.organizerIds || []).forEach((id) => ids.add(String(id)));
        (trip.travelerIds || []).forEach((id) => ids.add(String(id)));
    });

    return ids;
}

async function canAccessUserRecord(requester, targetUserId) {
    if (!requester) {
        return false;
    }
    if (isAdmin(requester)) {
        return true;
    }
    if (String(requester._id) === String(targetUserId)) {
        return true;
    }
    if (!isOrganizer(requester)) {
        return false;
    }

    const hasAccess = await Trip.exists({
        organizerIds: requester._id,
        $or: [
            { organizerIds: targetUserId },
            { travelerIds: targetUserId },
        ],
    });

    return !!hasAccess;
}

async function getFieldConfig(field, tripId) {
    if (tripId) {
        const tripSpecific = await FieldConfig.findOne({ field, tripId }).lean();
        if (tripSpecific) {
            return tripSpecific;
        }
    }

    return FieldConfig.findOne({ field, tripId: 'default' }).lean();
}

async function getFileFieldConfig(field) {
    return FieldConfig.findOne({
        field,
        type: 'file',
        enabled: { $ne: false },
    }).lean();
}

function ensurePersonalData(user) {
    if (!Array.isArray(user.personalData)) {
        user.personalData = [];
    }

    return user.personalData;
}

async function removeUploadedFile(filename) {
    if (!filename) {
        return;
    }

    try {
        await fs.promises.unlink(path.join(uploadDir, filename));
    } catch (_) {
    }
}

async function getUserFileEntries(user) {
    const personalData = Array.isArray(user.personalData) ? user.personalData : [];
    const fileFields = [...new Set(personalData.map((entry) => entry.field))];

    if (fileFields.length === 0) {
        return [];
    }

    const configs = await FieldConfig.find({
        field: { $in: fileFields },
        type: 'file',
    }, 'field').lean();

    const fileFieldSet = new Set(configs.map((config) => config.field));
    return personalData.filter((entry) => fileFieldSet.has(entry.field) && entry.value);
}

router.get('/users', auth, async (req, res) => {
    let users = [];
    let personalDataIds = new Set();

    if (isAdmin(req.user)) {
        users = await User.find().sort({ name: 1, username: 1 }).lean();
        personalDataIds = new Set(users.map((user) => String(user._id)));
    } else if (isOrganizer(req.user)) {
        users = await User.find({ role: { $ne: 'admin' } }).sort({ name: 1, username: 1 }).lean();
        personalDataIds = await getManagedUserIds(req.user);
    } else {
        users = await User.find({ _id: req.user._id }).lean();
        personalDataIds = new Set([String(req.user._id)]);
    }

    return res.json(users.map((user) => serializeUser(user, personalDataIds.has(String(user._id)))));
});

router.post('/users', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || 'traveler').trim();

    if (!['admin', 'organizer', 'traveler'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    if (!username || password.length < 8 || !email) {
        return res.status(400).json({ message: 'Username, email, and a password of at least 8 characters are required' });
    }

    const existing = await User.findOne({
        $or: [
            { username },
            { email },
        ],
    }).lean();

    if (existing) {
        return res.status(409).json({ message: 'Username or email already in use' });
    }

    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const user = await User.create({
        firstName,
        lastName,
        name: String(req.body.name || '').trim() || [firstName, lastName].filter(Boolean).join(' ').trim() || username,
        username,
        dateOfBirth: String(req.body.dateOfBirth || '').trim(),
        email,
        contactPhone: String(req.body.contactPhone || '').trim(),
        contactEmail: String(req.body.contactEmail || '').trim(),
        contactTitle: String(req.body.contactTitle || '').trim(),
        contactShowEmergency: !!req.body.contactShowEmergency,
        passwordHash: await bcrypt.hash(password, 10),
        role,
        personalData: Array.isArray(req.body.personalData) ? req.body.personalData : [],
        mustChangePassword: !!req.body.mustChangePassword,
    });

    return res.status(201).json(serializeUser(user, true));
});

router.put('/users/:id/contact', auth, async (req, res) => {
    if (String(req.user._id) !== req.params.id && !isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const updated = await User.findByIdAndUpdate(
        req.params.id,
        {
            contactPhone: String(req.body.contactPhone || '').trim(),
            contactEmail: String(req.body.contactEmail || '').trim(),
            contactTitle: String(req.body.contactTitle || '').trim(),
            contactShowEmergency: !!req.body.contactShowEmergency,
        },
        { new: true }
    );

    if (!updated) {
        return res.sendStatus(404);
    }

    return res.sendStatus(204);
});

router.put('/users/:id/preferences', auth, async (req, res) => {
    if (String(req.user._id) !== req.params.id && !isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    if (typeof req.body.themePreference !== 'undefined') {
        const themePreference = String(req.body.themePreference || '').trim();
        if (!['light', 'dark', 'auto'].includes(themePreference)) {
            return res.status(400).json({ message: 'Invalid theme preference' });
        }
        user.themePreference = themePreference;
    }

    if (typeof req.body.betaBannerDismissed !== 'undefined') {
        user.betaBannerDismissed = !!req.body.betaBannerDismissed;
    }

    await user.save();
    return res.json(serializeUser(user, true));
});

router.put('/users/:id/role', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    const role = String(req.body.role || '').trim();
    if (!['admin', 'organizer', 'traveler'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    if (!['admin', 'organizer'].includes(role)) {
        const organizerTrip = await Trip.findOne({ organizerIds: user._id }, '_id').lean();
        if (organizerTrip) {
            return res.status(400).json({ message: 'Remove this user from organizer assignments before changing the role' });
        }
    }

    user.role = role;
    await user.save();

    return res.json(serializeUser(user, true));
});

router.delete('/users/:id', auth, async (req, res) => {
    if (!isAdmin(req.user)) {
        return res.sendStatus(403);
    }

    if (String(req.user._id) === req.params.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    const organizerTrips = await Trip.find({ organizerIds: user._id }, 'organizerIds').lean();
    if (organizerTrips.some((trip) => (trip.organizerIds || []).length <= 1)) {
        return res.status(400).json({ message: 'This user is the last organizer on at least one trip' });
    }

    const fileEntries = await getUserFileEntries(user);

    await Promise.all([
        ...fileEntries.map((entry) => removeUploadedFile(entry.value)),
        removeUploadedFile(user.passportPhoto),
        Trip.updateMany({ organizerIds: user._id }, { $pull: { organizerIds: user._id } }),
        Trip.updateMany({ travelerIds: user._id }, { $pull: { travelerIds: user._id } }),
        User.deleteOne({ _id: user._id }),
    ]);

    return res.sendStatus(204);
});

router.post('/users/:id/password', auth, async (req, res) => {
    if (String(req.user._id) !== req.params.id) {
        return res.sendStatus(403);
    }

    const oldPassword = String(req.body.oldPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    let valid = false;
    if (isBcryptHash(user.passwordHash || '')) {
        valid = await bcrypt.compare(oldPassword, user.passwordHash);
    } else {
        const legacyHash = crypto.createHash('sha256').update(oldPassword).digest('hex');
        valid = user.passwordHash === legacyHash;
    }

    if (!valid) {
        return res.status(403).json({ message: 'Current password incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: 'Password updated' });
});

router.put('/users/:id/personal-data', auth, async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }

    const field = String(req.body.field || '').trim();
    const value = String(req.body.value || '');
    const tripId = String(req.body.tripId || '').trim();

    if (!field) {
        return res.status(400).json({ message: 'Field is required' });
    }

    const config = await getFieldConfig(field, tripId);
    if (!config || config.enabled === false || config.locked) {
        return res.status(403).json({ message: 'Field disabled or locked' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    const personalData = ensurePersonalData(user);
    const entry = personalData.find((item) => item.field === field);

    if (entry) {
        if (entry.locked) {
            return res.status(403).json({ message: 'Field locked' });
        }
        entry.value = value;
    } else {
        personalData.push({ field, value, locked: false });
    }

    await user.save();
    return res.json(serializeUser(user, true));
});

router.get('/users/:id/personal-data', auth, async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id, 'personalData').lean();
    if (!user) {
        return res.sendStatus(404);
    }

    return res.json(user.personalData || []);
});

router.put('/users/:id/personal-data/:field/lock', auth, async (req, res) => {
    if (!(isAdmin(req.user) || (isOrganizer(req.user) && (await canAccessUserRecord(req.user, req.params.id))))) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    const personalData = ensurePersonalData(user);
    const entry = personalData.find((item) => item.field === req.params.field);

    if (!entry) {
        return res.sendStatus(404);
    }

    entry.locked = !!req.body.locked;
    await user.save();

    return res.json(serializeUser(user, true));
});

router.post('/users/:id/passport-photo', auth, upload.single('photo'), async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }
    if (!req.file) {
        return res.sendStatus(400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        await removeUploadedFile(req.file.filename);
        return res.sendStatus(404);
    }

    await removeUploadedFile(user.passportPhoto);
    user.passportPhoto = req.file.filename;
    await user.save();

    return res.json({ path: req.file.filename });
});

router.get('/users/:id/passport-photo', auth, async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id, 'passportPhoto').lean();
    if (!user || !user.passportPhoto) {
        return res.sendStatus(404);
    }

    return res.sendFile(path.join(uploadDir, user.passportPhoto));
});

router.post('/users/:id/personal-data/:field/file', auth, upload.single('file'), async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }
    if (!req.file) {
        return res.sendStatus(400);
    }

    const config = await getFileFieldConfig(req.params.field);
    if (!config || config.locked) {
        await removeUploadedFile(req.file.filename);
        return res.status(400).json({ message: 'Invalid field' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        await removeUploadedFile(req.file.filename);
        return res.sendStatus(404);
    }

    const personalData = ensurePersonalData(user);
    const entry = personalData.find((item) => item.field === req.params.field);

    if (entry?.locked) {
        await removeUploadedFile(req.file.filename);
        return res.status(403).json({ message: 'Field locked' });
    }

    if (entry?.value) {
        await removeUploadedFile(entry.value);
        entry.value = req.file.filename;
    } else {
        personalData.push({ field: req.params.field, value: req.file.filename, locked: false });
    }

    await user.save();
    return res.json({ path: req.file.filename });
});

router.get('/users/:id/personal-data/:field/file', auth, async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id, 'personalData').lean();
    if (!user) {
        return res.sendStatus(404);
    }

    const entry = (user.personalData || []).find((item) => item.field === req.params.field);
    if (!entry?.value) {
        return res.sendStatus(404);
    }

    return res.sendFile(path.join(uploadDir, entry.value));
});

router.delete('/users/:id/personal-data/:field/file', auth, async (req, res) => {
    if (!(await canAccessUserRecord(req.user, req.params.id))) {
        return res.sendStatus(403);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.sendStatus(404);
    }

    const personalData = ensurePersonalData(user);
    const entry = personalData.find((item) => item.field === req.params.field);

    if (!entry?.value) {
        return res.sendStatus(404);
    }
    if (entry.locked) {
        return res.status(403).json({ message: 'Field locked' });
    }

    await removeUploadedFile(entry.value);
    entry.value = '';
    await user.save();

    return res.sendStatus(204);
});

export default router;
