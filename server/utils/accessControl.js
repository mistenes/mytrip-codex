import Trip from '../models/Trip.js';

export function isAdmin(user) {
    return user?.role === 'admin';
}

export function isOrganizer(user) {
    return user?.role === 'organizer';
}

export function isTraveler(user) {
    return user?.role === 'traveler';
}

export function buildTripAccessFilter(user) {
    if (!user) return { _id: null };
    if (isAdmin(user)) return {};
    if (isOrganizer(user)) {
        return {
            $or: [
                { organizerIds: user._id },
                { travelerIds: user._id },
            ],
        };
    }
    return { travelerIds: user._id };
}

export function buildManagedTripFilter(user) {
    if (!user) return { _id: null };
    if (isAdmin(user)) return {};
    if (isOrganizer(user)) return { organizerIds: user._id };
    return { _id: null };
}

export function isTripManager(user, trip) {
    if (!user || !trip) return false;
    if (isAdmin(user)) return true;
    if (!isOrganizer(user)) return false;
    const organizers = Array.isArray(trip.organizerIds) ? trip.organizerIds : [];
    return organizers.some((id) => String(id) === String(user._id));
}

export async function canAccess(requester, targetUserId) {
    if (!requester) return false;
    if (isAdmin(requester)) return true;
    if (String(requester._id) === String(targetUserId)) return true;
    if (isOrganizer(requester)) {
        const trip = await Trip.findOne({ organizerIds: requester._id, travelerIds: targetUserId });
        if (trip) return true;
    }
    return false;
}

export async function canAccessTrip(user, trip) {
    if (!user) return false;
    const resolvedTrip = typeof trip === 'object' ? trip : await Trip.findById(trip);
    if (!resolvedTrip) return false;
    if (isAdmin(user)) return true;
    if ((resolvedTrip.organizerIds || []).some((id) => String(id) === String(user._id))) return true;
    if ((resolvedTrip.travelerIds || []).some((id) => String(id) === String(user._id))) return true;
    return false;
}
