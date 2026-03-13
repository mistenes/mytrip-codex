import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import { User, Trip, FinancialRecord, Document, PersonalDataFieldConfig, PersonalDataRecord, PersonalDataUpdatePayload, ItineraryItem, Role, TripView, Theme, Message, SiteSettings, PaymentTransaction } from "../types";
import AccountSettings from "./AccountSettings";
import SiteSettingsView from "./SiteSettings";
import PassportReaderModal from "./PassportReaderModal";
import { MrzResult } from "../utils/mrz";
import "../styles/dashboard.css";
import "../styles/user-management.css";
import "../styles/financials.css";

const ROLE_LABELS: Record<Role, string> = {
    admin: 'Admin',
    organizer: 'Organizer',
    traveler: 'Traveler',
};

type MainView = 'trips' | 'users' | 'files' | 'account' | 'site';

type NavItem = {
    key: MainView;
    label: string;
};

type ResolvedDashboardRoute = {
    mainView: MainView;
    selectedTripId: string | null;
    activeTripView: TripView;
    canonicalPath: string | null;
};

const DASHBOARD_HOME_PATH = '/dashboard';

const MAIN_VIEW_PATHS: Record<Exclude<MainView, 'trips'>, string> = {
    users: '/dashboard/people',
    files: '/dashboard/files',
    account: '/dashboard/account',
    site: '/dashboard/site',
};

const TRIP_VIEW_SEGMENTS: Record<TripView, string> = {
    summary: '',
    financials: 'finances',
    itinerary: 'itinerary',
    documents: 'documents',
    personalData: 'personal-data',
    messages: 'messages',
    contact: 'contact',
    users: 'participants',
    settings: 'settings',
};

const TRIP_VIEW_ALIASES: Record<string, TripView> = {
    summary: 'summary',
    overview: 'summary',
    financials: 'financials',
    finances: 'financials',
    itinerary: 'itinerary',
    documents: 'documents',
    'personal-data': 'personalData',
    personaldata: 'personalData',
    messages: 'messages',
    contact: 'contact',
    participants: 'users',
    users: 'users',
    settings: 'settings',
};

const normalizePathname = (pathname: string) => {
    if (!pathname) {
        return DASHBOARD_HOME_PATH;
    }

    const trimmed = pathname.replace(/\/+$/, '');
    return trimmed || '/';
};

const getMainViewPath = (view: MainView) => {
    if (view === 'trips') {
        return DASHBOARD_HOME_PATH;
    }

    return MAIN_VIEW_PATHS[view];
};

const getTripPath = (tripId: string, view: TripView = 'summary') => {
    const safeTripId = encodeURIComponent(tripId);
    const segment = TRIP_VIEW_SEGMENTS[view];
    return segment ? `/dashboard/trips/${safeTripId}/${segment}` : `/dashboard/trips/${safeTripId}`;
};

const parseTripView = (segment?: string): TripView => {
    if (!segment) {
        return 'summary';
    }

    return TRIP_VIEW_ALIASES[segment.toLowerCase()] || 'summary';
};

const resolveDashboardRoute = ({
    pathname,
    visibleTrips,
    featuredTrip,
    unreadCounts,
}: {
    pathname: string;
    visibleTrips: Trip[];
    featuredTrip: Trip | null;
    unreadCounts: Record<string, number>;
}): ResolvedDashboardRoute => {
    const normalizedPath = normalizePathname(pathname);
    const segments = normalizedPath
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

    const pickDefaultTrip = (view: TripView) => {
        if (view === 'messages') {
            return visibleTrips.find((trip) => unreadCounts[trip.id] > 0) || featuredTrip || visibleTrips[0] || null;
        }

        return featuredTrip || visibleTrips[0] || null;
    };

    const resolveTripAlias = (view: TripView): ResolvedDashboardRoute => {
        const targetTrip = pickDefaultTrip(view);
        if (!targetTrip) {
            return {
                mainView: 'trips',
                selectedTripId: null,
                activeTripView: 'summary',
                canonicalPath: null,
            };
        }

        return {
            mainView: 'trips',
            selectedTripId: targetTrip.id,
            activeTripView: view,
            canonicalPath: getTripPath(targetTrip.id, view),
        };
    };

    if (segments[0]?.toLowerCase() === 'dashboard') {
        segments.shift();
    }

    if (segments.length === 0) {
        return {
            mainView: 'trips',
            selectedTripId: null,
            activeTripView: 'summary',
            canonicalPath: DASHBOARD_HOME_PATH,
        };
    }

    const head = segments[0].toLowerCase();

    if (head === 'trips') {
        const tripId = segments[1] || null;
        const activeTripView = parseTripView(segments[2]);

        if (!tripId) {
            return {
                mainView: 'trips',
                selectedTripId: null,
                activeTripView: 'summary',
                canonicalPath: DASHBOARD_HOME_PATH,
            };
        }

        return {
            mainView: 'trips',
            selectedTripId: tripId,
            activeTripView,
            canonicalPath: getTripPath(tripId, activeTripView),
        };
    }

    if (head === 'people') {
        return {
            mainView: 'users',
            selectedTripId: null,
            activeTripView: 'summary',
            canonicalPath: MAIN_VIEW_PATHS.users,
        };
    }

    if (head === 'files') {
        return {
            mainView: 'files',
            selectedTripId: null,
            activeTripView: 'summary',
            canonicalPath: MAIN_VIEW_PATHS.files,
        };
    }

    if (head === 'account') {
        return {
            mainView: 'account',
            selectedTripId: null,
            activeTripView: 'summary',
            canonicalPath: MAIN_VIEW_PATHS.account,
        };
    }

    if (head === 'site' || head === 'brand-settings') {
        return {
            mainView: 'site',
            selectedTripId: null,
            activeTripView: 'summary',
            canonicalPath: MAIN_VIEW_PATHS.site,
        };
    }

    if (head === 'finances' || head === 'finance') {
        return resolveTripAlias('financials');
    }

    if (head === 'documents') {
        return resolveTripAlias('documents');
    }

    if (head === 'messages') {
        return resolveTripAlias('messages');
    }

    if (head === 'itinerary') {
        return resolveTripAlias('itinerary');
    }

    if (head === 'personal-data') {
        return resolveTripAlias('personalData');
    }

    return {
        mainView: 'trips',
        selectedTripId: null,
        activeTripView: 'summary',
        canonicalPath: DASHBOARD_HOME_PATH,
    };
};

const formatDisplayDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getTripDurationDays = (trip: Trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }

    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const getTripStageMeta = (trip: Trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
        return {
            label: 'Completed',
            className: 'is-complete',
            summary: 'The trip has wrapped. Final documentation and reconciliation are the remaining priorities.',
        };
    }

    if (start > today) {
        return {
            label: 'Preparing',
            className: 'is-upcoming',
            summary: 'Focus on collecting documents, payments, and traveler data before departure.',
        };
    }

    return {
        label: 'Live',
        className: 'is-live',
        summary: 'The trip is active. Keep communications, files, and on-trip operations aligned here.',
    };
};

const useMediaQuery = (query: string) => {
    const getMatches = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const mediaQuery = window.matchMedia(query);
        const listener = () => setMatches(mediaQuery.matches);
        listener();
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

const getTripNavItems = (trip: Trip, userRole: Role, userId: string) => {
    const tripNavItems: { key: TripView; label: string }[] = [
        { key: 'summary', label: 'Overview' },
        { key: 'itinerary', label: 'Itinerary' },
        { key: 'financials', label: 'Finance' },
        { key: 'personalData', label: 'Personal data' },
        { key: 'documents', label: 'Documents' },
        { key: 'messages', label: 'Messages' },
    ];

    if (userRole === 'admin' || (userRole === 'organizer' && trip.organizerIds.includes(userId))) {
        tripNavItems.push({ key: 'contact', label: 'Emergency contact' });
        tripNavItems.push({ key: 'users', label: 'Participants' });
        tripNavItems.push({ key: 'settings', label: 'Settings' });
    }

    return tripNavItems;
};

const getPrimaryMobileNavItems = (role: Role): Array<{ key: string; label: string }> => {
    if (role === 'traveler') {
        return [
            { key: 'home', label: 'Home' },
            { key: 'trips', label: 'Trips' },
            { key: 'messages', label: 'Messages' },
            { key: 'account', label: 'Account' },
            { key: 'more', label: 'More' },
        ];
    }

    return [
        { key: 'home', label: 'Home' },
        { key: 'trips', label: 'Trips' },
        { key: 'files', label: 'Files' },
        { key: 'account', label: 'Account' },
        { key: 'more', label: 'More' },
    ];
};

const SectionIntro = ({
    eyebrow,
    title,
    description,
    actions,
    meta,
    className = '',
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    meta?: React.ReactNode;
    className?: string;
}) => (
    <section className={`section-intro-card ${className}`.trim()}>
        <div className="section-intro-copy">
            {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
            {description && <p>{description}</p>}
        </div>
        {(actions || meta) && (
            <div className="section-intro-side">
                {meta && <div className="section-intro-meta">{meta}</div>}
                {actions && <div className="section-intro-actions">{actions}</div>}
            </div>
        )}
    </section>
);

const ThemeSwitcher = ({ theme, onThemeChange }: { theme: Theme, onThemeChange: (theme: Theme) => void }) => (
    <div className="theme-switcher">
        <button className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')} aria-label="Light theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')} aria-label="Dark theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <button className={theme === 'auto' ? 'active' : ''} onClick={() => onThemeChange('auto')} aria-label="System theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </button>
    </div>
);

const Header = ({ user, onToggleSidebar, showHamburger }: {
    user: User;
    onToggleSidebar: () => void;
    showHamburger: boolean;
}) => (
  <header className="app-header app-header-v2">
    <div className="header-left">
         {showHamburger && (
            <button className="hamburger-menu" onClick={onToggleSidebar} aria-label="Open navigation">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
         )}
         <div className="brand-lockup">
            <span className="brand-kicker">Travel operations</span>
            <h1 className="logo">myTrip</h1>
         </div>
    </div>
    <div className="user-info">
      <div className="user-badge user-badge-v2">
        <span className="user-badge-label">Signed in</span>
        <strong>{user.name}</strong>
        <span className="user-badge-meta">{ROLE_LABELS[user.role]}</span>
      </div>
    </div>
  </header>
);

const CreateTripModal = ({
  isOpen,
  onClose,
  currentUser,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onCreated: (trip: Trip) => void;
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setOrganizerId('');
    setOrganizers([]);
    setIsLoadingOrganizers(false);
    setIsSubmitting(false);
    setFormError('');
  };

  const handleDismiss = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoadingOrganizers(true);
    setFormError('');

    fetch(`${API_BASE}/api/users`)
      .then(async (res) => {
        const payload = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error('load_failed');
        }
        return payload;
      })
      .then((users) => {
        if (cancelled) {
          return;
        }

        const eligibleLeads = users.filter((u: any) => u.role === 'organizer' || u.role === 'admin');
        setOrganizers(eligibleLeads);

        const currentUserOption = eligibleLeads.find((u: any) => String(u._id) === String(currentUser.id));
        setOrganizerId(currentUserOption?._id || eligibleLeads[0]?._id || '');

        if (eligibleLeads.length === 0) {
          setFormError('No organizer or admin account is available to own this trip yet.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFormError('We could not load the available trip leads. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOrganizers(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName || !startDate || !endDate || !organizerId) {
      setFormError('Please complete every required field before creating the trip.');
      return;
    }

    if (endDate < startDate) {
      setFormError('End date cannot be earlier than the start date.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const tripRes = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, startDate, endDate, organizerIds: [organizerId], travelerIds: [] })
      });

      const trip = await tripRes.json().catch(() => null);
      if (!tripRes.ok || !trip?._id) {
        throw new Error(trip?.message || 'create_failed');
      }

      const selectedOrganizer = organizers.find(o => o._id === organizerId);
      onCreated({
        id: trip._id,
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        organizerIds: [organizerId],
        organizerNames: selectedOrganizer ? [selectedOrganizer.name] : [],
        travelerIds: trip.travelerIds || [],
        emergencyContacts: [],
      });
      handleDismiss();
    } catch (error) {
      setFormError(error instanceof Error && error.message !== 'create_failed'
        ? error.message
        : 'We could not create the trip. Please check the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay dashboard-modal-overlay" onClick={handleDismiss}>
      <div className="modal-content dashboard-modal create-trip-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="createTripModalTitle">
        <div className="dashboard-modal-header">
          <div>
            <span className="dashboard-modal-eyebrow">Workspace setup</span>
            <h2 id="createTripModalTitle">Create trip</h2>
            <p>Set the trip window, assign the lead owner, and create a clean starting point for the operational flow.</p>
          </div>
          <button type="button" className="dashboard-modal-close" onClick={handleDismiss} aria-label="Close create trip modal">×</button>
        </div>
        {formError && (
          <div className="dashboard-modal-status error" role="alert">
            {formError}
          </div>
        )}
        <form className="dashboard-modal-form" onSubmit={handleSubmit}>
          <div className="dashboard-modal-field-grid">
            <div className="form-group">
              <label htmlFor="tripName">Trip name</label>
              <input id="tripName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Example: MSC Grandiosa" required />
            </div>
            <div className="form-group">
              <label htmlFor="organizer">Lead organizer</label>
              <select id="organizer" value={organizerId} onChange={e => setOrganizerId(e.target.value)} required disabled={isLoadingOrganizers || organizers.length === 0}>
                <option value="">{isLoadingOrganizers ? 'Loading leads...' : 'Choose a lead'}</option>
                {organizers.map(o => (
                  <option key={o._id} value={o._id}>{o.name}{o.role === 'admin' ? ' · Admin' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start date</label>
              <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End date</label>
              <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || undefined} required />
            </div>
          </div>
          <div className="dashboard-modal-preview">
            <span className="dashboard-modal-preview-label">Trip setup preview</span>
            <strong>{name.trim() || 'Untitled trip'}</strong>
            <p>
              {startDate && endDate
                ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
                : 'Choose the trip window to preview the final schedule block.'}
            </p>
          </div>
          <div className="modal-actions dashboard-modal-actions">
            <button type="button" onClick={handleDismiss} className="btn btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingOrganizers || organizers.length === 0}>
              {isSubmitting ? 'Creating...' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TripUserManagement = ({ trip, users, currentUser, onChange }: { trip: Trip; users: User[]; currentUser: User; onChange: () => void }) => {
  const organizers = users.filter(u => trip.organizerIds.includes(u.id));
  const travelers = users.filter(u => trip.travelerIds.includes(u.id));
  const availableOrganizers = users.filter(u => u.role === 'organizer' && !trip.organizerIds.includes(u.id));
  const availableTravelers = users.filter(u => u.role === 'traveler' && !trip.travelerIds.includes(u.id));
  const [newOrganizer, setNewOrganizer] = useState('');
  const [newTraveler, setNewTraveler] = useState('');

  const canManageOrganizers = currentUser.role === 'admin';
  const isOrganizerOfTrip = trip.organizerIds.includes(currentUser.id);
  const canManageTravelers = currentUser.role === 'admin' || (currentUser.role === 'organizer' && isOrganizerOfTrip);

  const addOrganizer = async () => {
    if (!newOrganizer) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}/organizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newOrganizer })
    });
    setNewOrganizer('');
    onChange();
  };

  const removeOrganizer = async (id: string) => {
    await fetch(`${API_BASE}/api/trips/${trip.id}/organizers/${id}`, { method: 'DELETE' });
    onChange();
  };

  const addTraveler = async () => {
    if (!newTraveler) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}/travelers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newTraveler })
    });
    setNewTraveler('');
    onChange();
  };

  const removeTraveler = async (id: string) => {
    await fetch(`${API_BASE}/api/trips/${trip.id}/travelers/${id}`, { method: 'DELETE' });
    onChange();
  };

  const [invites, setInvites] = useState<any[]>([]);
  const [isInviteOpen, setInviteOpen] = useState(false);

  const loadInvites = () => {
    fetch(`${API_BASE}/api/trips/${trip.id}/invitations`).then(res => res.json()).then(setInvites);
  };

  useEffect(() => {
    loadInvites();
  }, [trip.id]);

  const resendInvite = async (id: string) => {
    await fetch(`${API_BASE}/api/invitations/${id}/resend`, { method: 'POST' });
    loadInvites();
  };

  const revokeInvite = async (id: string) => {
    if (!window.confirm('Revoke this invite?')) return;
    await fetch(`${API_BASE}/api/invitations/${id}`, { method: 'DELETE' });
    loadInvites();
  };

  return (
    <div className="trip-user-management">
      <SectionIntro
        eyebrow="Trip roster"
        title={`Participants: ${trip.name}`}
        description="Manage organizers, travelers, and pending invitations for this trip."
      />
      <div className="trip-users-section">
        <h3>Organizers</h3>
        <ul>
          {organizers.map(o => (
            <li key={o.id}>
              {o.name}
              {canManageOrganizers && o.id !== currentUser.id && organizers.length > 1 && (
                <button className="btn btn-danger btn-small" onClick={() => removeOrganizer(o.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
        {canManageOrganizers && (
          <div className="assign-row">
            <select value={newOrganizer} onChange={e => setNewOrganizer(e.target.value)}>
              <option value="">Add organizer</option>
              {availableOrganizers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button className="btn btn-secondary btn-small" onClick={addOrganizer}>Assign</button>
          </div>
        )}
      </div>
      <div className="trip-users-section">
        <h3>Travelers</h3>
        <ul>
          {travelers.map(t => (
            <li key={t.id}>
              {t.name}
              {canManageTravelers && (
                <button className="btn btn-danger btn-small" onClick={() => removeTraveler(t.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>
        {canManageTravelers && (
          <>
            <div className="assign-row">
              <select value={newTraveler} onChange={e => setNewTraveler(e.target.value)}>
                <option value="">Add traveler</option>
                {availableTravelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn btn-secondary btn-small" onClick={addTraveler}>Assign</button>
            </div>
            <div className="assign-row">
              <button className="btn btn-secondary btn-small" onClick={() => setInviteOpen(true)}>Send invite</button>
            </div>
            {invites.length > 0 && (
              <div className="responsive-table-group">
                <table className="user-table desktop-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Expires</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {invites.map(inv => (
                      <tr key={inv._id}>
                        <td>{inv.firstName} {inv.lastName}</td>
                        <td>{inv.email}</td>
                        <td>{new Date(inv.expiresAt).toLocaleDateString('en-GB')}</td>
                        <td>{inv.used ? 'Registered' : 'Pending'}</td>
                        <td className="invite-actions">
                          {!inv.used && (
                            <>
                              <button className="btn btn-secondary btn-small" onClick={() => resendInvite(inv._id)}>Resend</button>
                              <button className="btn btn-danger btn-small" onClick={() => revokeInvite(inv._id)}>Revoke</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mobile-record-list">
                  {invites.map((inv: any) => (
                    <article key={inv._id} className="mobile-record-card">
                      <div className="mobile-record-head">
                        <strong>{inv.firstName} {inv.lastName}</strong>
                        <span>{inv.used ? 'Registered' : 'Pending'}</span>
                      </div>
                      <div className="mobile-record-meta">
                        <span>{inv.email}</span>
                        <span>Expires {new Date(inv.expiresAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      {!inv.used && (
                        <div className="mobile-record-actions">
                          <button className="btn btn-secondary btn-small" onClick={() => resendInvite(inv._id)}>Resend</button>
                          <button className="btn btn-danger btn-small" onClick={() => revokeInvite(inv._id)}>Revoke</button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
            <InviteUserModal
              isOpen={isInviteOpen}
              onClose={() => setInviteOpen(false)}
              trips={[trip]}
              onSent={loadInvites}
              currentUser={currentUser}
              fixedTripId={trip.id}
            />
          </>
        )}
      </div>
    </div>
  );
};

const TripSettings = ({ trip, user, onDeleted, onUpdated }: { trip: Trip; user: User; onDeleted: () => void; onUpdated: () => void }) => {
  const canManage = user.role === 'admin' || (user.role === 'organizer' && trip.organizerIds.includes(String(user.id)));
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);

  useEffect(() => {
    setName(trip.name);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
  }, [trip.name, trip.startDate, trip.endDate]);

  if (!canManage) {
    return <p>You do not have access to this settings area.</p>;
  }

  const handleSave = async () => {
    await fetch(`${API_BASE}/api/trips/${trip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate })
    });
    onUpdated();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip?')) return;
    if (!window.confirm('This action cannot be undone. Continue?')) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}`, { method: 'DELETE' });
    onDeleted();
  };

  return (
    <div className="trip-settings">
      <SectionIntro
        eyebrow="Trip settings"
        title={name}
        description="Update the core trip details and manage destructive actions from one place."
      />
      <div className="form-group">
        <label htmlFor="tripName">Trip name</label>
        <input id="tripName" type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="startDate">Start date</label>
        <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="endDate">End date</label>
        <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
        <button className="btn btn-danger" onClick={handleDelete}>Delete trip</button>
      </div>
    </div>
  );
};

const TripContactInfo = ({ user, onSaved }: { user: User; onSaved: () => void }) => {
  const [contactPhone, setContactPhone] = useState(user.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(user.contactEmail || '');
  const [contactTitle, setContactTitle] = useState(user.contactTitle || '');
  const [contactShowEmergency, setContactShowEmergency] = useState(!!user.contactShowEmergency);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const statusTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    };
  }, []);

  const clearStatusTimer = () => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!user.token) {
      setStatus('error');
      setStatusMessage('You do not have permission to update this contact card.');
      return;
    }
    clearStatusTimer();
    setStatus('saving');
    setStatusMessage('Saving changes...');
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ contactPhone, contactEmail, contactTitle, contactShowEmergency }),
      });
      if (!res.ok) {
        throw new Error('save_failed');
      }
      setStatus('success');
      setStatusMessage('Emergency contact profile updated.');
      onSaved();
      statusTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
        statusTimerRef.current = null;
      }, 4000);
    } catch (err) {
      setStatus('error');
      setStatusMessage('Saving failed. Please try again.');
    }
  };

  return (
    <div className="contact-info-form">
      <SectionIntro
        eyebrow="Emergency profile"
        title="Emergency contact details"
        description="Control how your organizer profile appears inside the emergency contact panel for this trip."
      />
      <div className="form-group">
        <label htmlFor="contactTitle">Role / title</label>
        <input
          id="contactTitle"
          type="text"
          value={contactTitle}
          onChange={e => setContactTitle(e.target.value)}
          placeholder="Example: Lead organizer"
        />
      </div>
      <div className="form-group">
        <label htmlFor="contactPhone">Phone number</label>
        <input id="contactPhone" type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="contactEmail">Email</label>
        <input id="contactEmail" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
      </div>
      <div className="form-group contact-toggle">
        <label>
          <input
            type="checkbox"
            checked={contactShowEmergency}
            onChange={e => setContactShowEmergency(e.target.checked)}
          />
          <span>Show this profile in the emergency contacts block</span>
        </label>
        <p className="form-hint">This appears in the trip overview emergency panel for participants.</p>
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save profile'}
        </button>
      </div>
      {status !== 'idle' && (
        <div className={`contact-info-status ${status}`} role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

const InviteUserModal = ({
  isOpen,
  onClose,
  trips,
  onSent,
  currentUser,
  fixedTripId,
}: {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onSent: () => void;
  currentUser: User;
  fixedTripId?: string;
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('traveler');
  const [tripId, setTripId] = useState<string>(fixedTripId || '');
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isOrganizer = currentUser.role === 'organizer';
  const availableTrips = isOrganizer ? trips.filter(t => t.organizerIds.includes(currentUser.id)) : trips;

  const visibleInvites = useMemo(() => {
    return invites.filter((invite) => {
      if (fixedTripId) {
        return invite.tripId === fixedTripId;
      }

      if (isOrganizer) {
        return !invite.tripId || availableTrips.some((trip) => trip.id === invite.tripId);
      }

      return true;
    });
  }, [availableTrips, fixedTripId, invites, isOrganizer]);

  const selectedTripName = fixedTripId
    ? trips.find((trip) => trip.id === fixedTripId)?.name || 'Assigned after send'
    : availableTrips.find((trip) => trip.id === tripId)?.name || 'No trip assigned yet';
  const invitePreviewFirstName = firstName.trim() || 'First name';
  const invitePreviewLastName = lastName.trim() || 'Last name';

  const resetInviteForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setTripId(fixedTripId || '');
    setRole('traveler');
    setInvites([]);
    setIsSubmitting(false);
    setFormError('');
  };

  const handleDismiss = () => {
    resetInviteForm();
    onClose();
  };

  const loadInvites = () => {
    setIsLoadingInvites(true);
    setFormError('');

    fetch(`${API_BASE}/api/invitations`)
      .then(async (res) => {
        const payload = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error('load_failed');
        }
        return payload;
      })
      .then(setInvites)
      .catch(() => {
        setFormError('We could not load the pending invites right now.');
      })
      .finally(() => {
        setIsLoadingInvites(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      resetInviteForm();
      loadInvites();
      if (isOrganizer) {
        setRole('traveler');
      }
      if (fixedTripId) {
        setTripId(fixedTripId);
      }
    }
  }, [fixedTripId, isOpen, isOrganizer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      setFormError('Please complete every required field before sending the invite.');
      return;
    }

    if (isOrganizer && !fixedTripId && !tripId) {
      setFormError('Choose a trip before sending an organizer-managed invite.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch(`${API_BASE}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          role: isOrganizer ? 'traveler' : role,
          tripId: tripId || undefined
        })
      });

      const payload = await res.json().catch(() => null);
      if (res.status === 409) {
        setFormError('There is already an invite for this email address. Resend it from the People area.');
        return;
      }

      if (!res.ok) {
        throw new Error(payload?.message || 'Unable to send the invite.');
      }

      onSent();
      handleDismiss();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to send the invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay dashboard-modal-overlay" onClick={handleDismiss}>
      <div className="modal-content dashboard-modal invite-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="inviteModalTitle">
        <div className="dashboard-modal-header">
          <div>
            <span className="dashboard-modal-eyebrow">Traveler onboarding</span>
            <h2 id="inviteModalTitle">Send invite</h2>
            <p>Use passport-style spelling and make the role and trip assignment explicit before sending the access email.</p>
          </div>
          <button type="button" className="dashboard-modal-close" onClick={handleDismiss} aria-label="Close invite modal">×</button>
        </div>
        <p className="modal-note">Use passport-style English spelling for names and keep the invite details clean and complete.</p>
        {formError && (
          <div className="dashboard-modal-status error" role="alert">
            {formError}
          </div>
        )}
        <form className="dashboard-modal-form" onSubmit={handleSubmit}>
          <div className="dashboard-modal-field-grid">
            <div className="form-group">
              <label htmlFor="inviteFirstName">First name</label>
              <input id="inviteFirstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="inviteLastName">Last name</label>
              <input id="inviteLastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div className="form-group dashboard-modal-field-wide">
              <label htmlFor="inviteEmail">Email</label>
              <input id="inviteEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {!isOrganizer && (
              <div className="form-group">
                <label htmlFor="inviteRole">Role</label>
                <select id="inviteRole" value={role} onChange={e => setRole(e.target.value as Role)}>
                  <option value="organizer">Organizer</option>
                  <option value="traveler">Traveler</option>
                </select>
              </div>
            )}
            {!fixedTripId && (
              <div className="form-group">
                <label htmlFor="inviteTrip">Trip{isOrganizer ? '' : ' (optional)'}</label>
                <select id="inviteTrip" value={tripId} onChange={e => setTripId(e.target.value)} required={isOrganizer}>
                  {!isOrganizer && <option value="">No trip yet</option>}
                  {availableTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="dashboard-modal-preview">
            <span className="dashboard-modal-preview-label">Invite summary</span>
            <strong>{invitePreviewFirstName} {invitePreviewLastName}</strong>
            <p>{isOrganizer ? 'Traveler access' : `${ROLE_LABELS[role]} access`} · {selectedTripName}</p>
          </div>
          <div className="modal-actions dashboard-modal-actions">
            <button type="button" onClick={handleDismiss} className="btn btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send invite'}
            </button>
          </div>
        </form>
        {visibleInvites.length > 0 && (
          <div className="pending-invites dashboard-modal-section-card">
            <h3>Pending invites</h3>
            {isLoadingInvites && <p className="dashboard-modal-status info">Refreshing invite list…</p>}
            <div className="responsive-table-group">
              <table className="user-table desktop-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Trip</th><th>Expires</th></tr>
                </thead>
                <tbody>
                  {visibleInvites.map((inv: any) => (
                    <tr key={inv._id}>
                      <td>{inv.firstName} {inv.lastName}</td>
                      <td>{inv.email}</td>
                      <td>{ROLE_LABELS[inv.role as Role] || inv.role}</td>
                      <td>{availableTrips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                      <td>{new Date(inv.expiresAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mobile-record-list">
                {visibleInvites.map((inv: any) => (
                  <article key={inv._id} className="mobile-record-card">
                    <div className="mobile-record-head">
                      <strong>{inv.firstName} {inv.lastName}</strong>
                      <span>{ROLE_LABELS[inv.role as Role] || inv.role}</span>
                    </div>
                    <div className="mobile-record-meta">
                      <span>{inv.email}</span>
                      <span>{availableTrips.find(t => t.id === inv.tripId)?.name || 'No trip'}</span>
                      <span>Expires {new Date(inv.expiresAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagement = ({ onInvite, trips, users, refreshKey, onUsersChanged, currentUserRole }: { onInvite: () => void; trips: Trip[]; users: any[]; refreshKey: number; onUsersChanged: () => void; currentUserRole: Role; }) => {
  const [invites, setInvites] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [assignTripId, setAssignTripId] = useState('');

  const loadInvites = () => {
    fetch(`${API_BASE}/api/invitations`).then(res => res.json()).then(setInvites);
  };

  useEffect(() => {
    loadInvites();
  }, [refreshKey]);

  const handleResend = async (id: string) => {
    await fetch(`${API_BASE}/api/invitations/${id}/resend`, { method: 'POST' });
    loadInvites();
  };

  const handleDeleteInvite = async (id: string) => {
    if (!window.confirm('Delete this invite?')) return;
    await fetch(`${API_BASE}/api/invitations/${id}`, { method: 'DELETE' });
    loadInvites();
  };

  const organizers = users.filter(u => u.role === 'organizer');
  const others = users.filter(u => u.role !== 'organizer');

  const userTrips = selectedUser ? trips.filter(t => t.organizerIds.includes(selectedUser._id) || t.travelerIds.includes(selectedUser._id)) : [];

  const handleAssignOrganizer = async () => {
    if (!selectedUser || !assignTripId) return;
    await fetch(`${API_BASE}/api/trips/${assignTripId}/organizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUser._id })
    });
    setAssignTripId('');
    onUsersChanged();
  };

  const handleRemoveFromTrip = async (tripId: string) => {
    if (!selectedUser) return;
    const path = selectedUser.role === 'organizer'
      ? `/api/trips/${tripId}/organizers/${selectedUser._id}`
      : `/api/trips/${tripId}/travelers/${selectedUser._id}`;
    await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    onUsersChanged();
  };

  const handlePromoteToOrganizer = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Promote this user to organizer?')) return;
    await fetch(`${API_BASE}/api/users/${selectedUser._id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'organizer' })
    });
    setSelectedUser(prev => prev ? { ...prev, role: 'organizer' } : prev);
    onUsersChanged();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Delete this user?')) return;
    await fetch(`${API_BASE}/api/users/${selectedUser._id}`, { method: 'DELETE' });
    setSelectedUser(null);
    onUsersChanged();
  };

  return (
    <div className="user-management">
      <div className="dashboard-header">
        <div>
          <h2>People</h2>
          <p className="dashboard-header-intro">Manage organizers, travelers, trip assignments, and invite status from one workspace.</p>
        </div>
        <button onClick={onInvite} className="btn btn-secondary">Send invite</button>
      </div>

      <h3>Organizers ({organizers.length})</h3>
      {organizers.length > 0 ? (
        <div className="user-tiles">
          {organizers.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile organizer${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">Organizer</div>
            </div>
          ))}
        </div>
      ) : <p>No organizers yet.</p>}

      <h3>Other users ({others.length})</h3>
      {others.length > 0 ? (
        <div className="user-tiles">
          {others.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile ${u.role}${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">{ROLE_LABELS[u.role as Role] || u.role}</div>
            </div>
          ))}
        </div>
      ) : <p className="no-users">No users found.</p>}

      {selectedUser && (
        <div className="user-detail">
          <h3>{selectedUser.name}</h3>
          {currentUserRole === 'admin' && selectedUser.role === 'traveler' && (
            <button className="btn btn-primary" onClick={handlePromoteToOrganizer}>
              Promote to organizer
            </button>
          )}
          {userTrips.length > 0 ? (
            <ul>
              {userTrips.map(t => (
                <li key={t.id}>{t.name} <button className="btn btn-danger btn-small" onClick={() => handleRemoveFromTrip(t.id)}>Remove</button></li>
              ))}
            </ul>
          ) : <p>Not assigned to any trip yet.</p>}
          {selectedUser.role === 'organizer' && (
            <div className="assign-trip">
              <select value={assignTripId} onChange={e => setAssignTripId(e.target.value)}>
                <option value="">Assign to trip</option>
                {trips.filter(t => !t.organizerIds.includes(selectedUser._id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-small" onClick={handleAssignOrganizer}>Assign</button>
            </div>
          )}
          <button className="btn btn-danger" onClick={handleDeleteUser}>Delete user</button>
        </div>
      )}

      {invites.length > 0 && (
        <div className="pending-invites">
          <h3>Pending invites</h3>
          <div className="responsive-table-group">
            <table className="user-table desktop-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Trip</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invites.map((inv: any) => (
                  <tr key={inv._id}>
                    <td>{inv.firstName} {inv.lastName}</td>
                    <td>{inv.email}</td>
                    <td>{ROLE_LABELS[inv.role as Role] || inv.role}</td>
                    <td>{trips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                    <td>{new Date(inv.expiresAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div className="invite-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => handleResend(inv._id)}>Resend</button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteInvite(inv._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-record-list">
              {invites.map((inv: any) => (
                <article key={inv._id} className="mobile-record-card">
                  <div className="mobile-record-head">
                    <strong>{inv.firstName} {inv.lastName}</strong>
                    <span>{ROLE_LABELS[inv.role as Role] || inv.role}</span>
                  </div>
                  <div className="mobile-record-meta">
                    <span>{inv.email}</span>
                    <span>{trips.find(t => t.id === inv.tripId)?.name || 'No trip'}</span>
                    <span>Expires {new Date(inv.expiresAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="mobile-record-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => handleResend(inv._id)}>Resend</button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteInvite(inv._id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip, tripPath }: { trip: Trip; tripPath: string; }) => {
    const stage = getTripStageMeta(trip);
    const durationDays = getTripDurationDays(trip);

    return (
        <article className="trip-card trip-card-v2">
            <div className="trip-card-shell trip-card-shell-v2">
                <div className="trip-card-topline trip-card-topline-v2">
                    <span className={`trip-stage-badge ${stage.className}`}>{stage.label}</span>
                    <span className="trip-card-range">{formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}</span>
                </div>
                <h3>{trip.name}</h3>
                <p className="trip-card-summary">{stage.summary}</p>
                <div className="trip-card-metrics trip-card-metrics-v2">
                    <div className="trip-card-metric trip-card-metric-v2">
                        <span>Duration</span>
                        <strong>{durationDays} days</strong>
                    </div>
                    <div className="trip-card-metric trip-card-metric-v2">
                        <span>Organizers</span>
                        <strong>{trip.organizerNames?.length || 0}</strong>
                    </div>
                    <div className="trip-card-metric trip-card-metric-v2">
                        <span>Participants</span>
                        <strong>{trip.travelerIds.length}</strong>
                    </div>
                </div>
                <div className="trip-card-foot trip-card-foot-v2">
                    <span>Lead organizers</span>
                    <strong>{trip.organizerNames?.join(', ') || 'Not assigned yet'}</strong>
                </div>
            </div>
            <div className="trip-card-actions trip-card-actions-v2">
                <Link to={tripPath} className="btn btn-primary">
                    Open trip
                </Link>
            </div>
        </article>
    );
};

// --- TRIP CONTENT COMPONENTS ---

const TripSummary = ({ trip, user, users, onSelectView }: { trip: Trip; user: User; users: User[]; onSelectView: (view: TripView) => void; }) => {
    const [countdown, setCountdown] = useState("0 days");
    useEffect(() => {
        const updateCountdown = () => {
            const start = new Date(trip.startDate);
            const now = new Date();
            const diff = start.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown("Trip in progress");
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                setCountdown(`${days}d ${hours}h ${minutes}m`);
            }
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 60000);
        return () => clearInterval(timer);
    }, [trip.startDate]);

    const emergencyContacts = useMemo(() => {
        type DisplayContact = {
            id?: string;
            firstName?: string;
            lastName?: string;
            name?: string;
            contactTitle?: string;
            contactPhone?: string;
            contactEmail?: string;
        };

        const fromTrip: DisplayContact[] = (trip.emergencyContacts || []).map(contact => ({
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            name: contact.name,
            contactTitle: contact.contactTitle,
            contactPhone: contact.contactPhone,
            contactEmail: contact.contactEmail,
        }));

        const organizerIds = trip.organizerIds.map(id => String(id));
        const fromUsers: DisplayContact[] = users
            .filter(u => organizerIds.includes(String(u.id)) && u.contactShowEmergency)
            .map(u => ({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                name: u.name,
                contactTitle: u.contactTitle,
                contactPhone: u.contactPhone,
                contactEmail: u.contactEmail,
            }));

        if (fromUsers.length === 0) {
            return fromTrip;
        }

        const merged = new Map<string, DisplayContact>();
        fromTrip.forEach((contact, index) => {
            const key = contact.id || `trip-${index}`;
            merged.set(key, contact);
        });
        fromUsers.forEach((contact, index) => {
            const key = contact.id || `user-${index}`;
            const previous = merged.get(key) || {};
            merged.set(key, { ...previous, ...contact });
        });

        return Array.from(merged.values());
    }, [trip.emergencyContacts, trip.organizerIds, users]);

    const stage = getTripStageMeta(trip);
    const durationDays = getTripDurationDays(trip);
    const summaryFocus = user.role === 'traveler'
        ? 'Review your documents, check your balance, and catch up on the latest trip updates.'
        : 'Track payments, traveler data, and missing documents before they turn into operational gaps.';

    const tiles: { key: TripView; label: string; hint: string; className: string }[] = [
        { key: 'itinerary', label: 'Itinerary', hint: 'schedule, timing, movement', className: 'tile-itinerary' },
        { key: 'documents', label: 'Documents', hint: 'tickets, PDFs, uploaded files', className: 'tile-documents' },
        { key: 'messages', label: 'Messages', hint: 'comms, updates, reminders', className: 'tile-messages' },
        { key: 'financials', label: 'Finance', hint: 'balance, credits, online payments', className: 'tile-financials' },
        { key: 'personalData', label: 'Personal data', hint: 'passport and profile details', className: 'tile-personal' },
    ];
    if (user.role === 'admin' || (user.role === 'organizer' && trip.organizerIds.includes(String(user.id)))) {
        tiles.push({ key: 'users', label: 'Participants', hint: 'roles, assignments, invites', className: 'tile-users' });
        tiles.push({ key: 'settings', label: 'Settings', hint: 'trip configuration', className: 'tile-settings' });
    }

    return (
        <div className="trip-summary trip-summary-v2">
            <section className="trip-summary-hero trip-summary-hero-v2">
                <div className="trip-summary-shell-v2">
                    <div className="trip-summary-copy trip-summary-copy-v2">
                        <div className="trip-summary-headline-row trip-summary-headline-row-v2">
                        <span className="trip-summary-eyebrow">Trip cockpit</span>
                        <span className={`trip-stage-badge ${stage.className}`}>{stage.label}</span>
                        </div>
                        <h2 className="trip-title">{trip.name}</h2>
                        <p className="trip-summary-subtitle">
                            Everything this trip needs lives here: schedule, files, communications, traveler data, and payment activity.
                        </p>
                        <div className="trip-summary-route trip-summary-route-v2">
                            <div className="trip-summary-route-card-v2">
                                <span>Trip window</span>
                                <strong>{formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}</strong>
                            </div>
                            <div className="trip-summary-route-card-v2">
                                <span>Operational focus</span>
                                <strong>{stage.summary}</strong>
                            </div>
                        </div>
                    </div>
                    <aside className="trip-summary-aside-v2">
                        <div className="trip-summary-metrics trip-summary-metrics-v2">
                            <div className="trip-metric-card trip-metric-card-v2">
                                <span className="trip-metric-label">Countdown</span>
                                <strong>{countdown}</strong>
                            </div>
                            <div className="trip-metric-card trip-metric-card-v2">
                                <span className="trip-metric-label">Duration</span>
                                <strong>{durationDays} days</strong>
                            </div>
                            <div className="trip-metric-card trip-metric-card-v2">
                                <span className="trip-metric-label">Travelers</span>
                                <strong>{trip.travelerIds.length}</strong>
                            </div>
                            <div className="trip-metric-card trip-metric-card-v2">
                                <span className="trip-metric-label">Organizers</span>
                                <strong>{trip.organizerNames?.length || 0}</strong>
                            </div>
                        </div>
                        <div className="trip-summary-callout trip-summary-callout-v2">
                            <span>{user.role === 'traveler' ? 'Recommended next step' : 'Operational focus'}</span>
                            <strong>{summaryFocus}</strong>
                        </div>
                    </aside>
                </div>
            </section>
            <section className="summary-tiles summary-tiles-refresh summary-tiles-v2">
                {tiles.map(t => (
                    <button
                        key={t.key}
                        className={`summary-tile summary-tile-v2 ${t.className}`}
                        onClick={() => onSelectView(t.key)}
                    >
                        <span>{t.label}</span>
                        <small>{t.hint}</small>
                    </button>
                ))}
            </section>
            <section className="trip-summary-side-grid trip-summary-side-grid-v2">
                <div className="trip-summary-panel trip-summary-panel-v2">
                    <div className="trip-summary-panel-head-v2">
                        <h3>Operational overview</h3>
                        <p>Core trip facts and handoff context, laid out cleanly for quick scanning.</p>
                    </div>
                    <div className="trip-summary-facts trip-summary-facts-v2">
                        <div className="trip-summary-fact-card-v2">
                            <span>Start</span>
                            <strong>{formatDisplayDate(trip.startDate)}</strong>
                        </div>
                        <div className="trip-summary-fact-card-v2">
                            <span>End</span>
                            <strong>{formatDisplayDate(trip.endDate)}</strong>
                        </div>
                        <div className="trip-summary-fact-card-v2 trip-summary-fact-card-wide-v2">
                            <span>Lead organizers</span>
                            <strong>{trip.organizerNames?.join(', ') || 'Not assigned yet'}</strong>
                        </div>
                    </div>
                </div>
                <div className="emergency-contacts trip-summary-panel trip-summary-panel-v2 emergency-contacts-v2">
                    <div className="trip-summary-panel-head-v2">
                        <h3>Emergency contacts</h3>
                        <p>Published organizer contacts for quick traveler access and support.</p>
                    </div>
                    {emergencyContacts.length > 0 ? (
                        <div className="trip-summary-contact-list-v2">
                            {emergencyContacts.map((o, index) => {
                                const displayName = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.name || 'Unknown contact';
                                const key = o.id || o.contactEmail || o.contactPhone || `contact-${index}`;
                                return (
                                    <div key={key} className="contact-card contact-card-v2">
                                        <div className="contact-card-top-v2">
                                            <div className="contact-name">{displayName}</div>
                                            {o.contactTitle && <div className="contact-title">{o.contactTitle}</div>}
                                        </div>
                                        <div className="contact-card-meta-v2">
                                            {o.contactPhone && (
                                                <div className="contact-detail-row-v2">
                                                    <span>Phone</span>
                                                    <strong>{o.contactPhone}</strong>
                                                </div>
                                            )}
                                            {o.contactEmail && (
                                                <div className="contact-detail-row-v2">
                                                    <span>Email</span>
                                                    <strong>{o.contactEmail}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="contact-empty">No emergency contact has been published for this trip yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

const PaymentStatusBadge = ({ status }: { status: PaymentTransaction['status'] }) => (
    <span className={`payment-status-badge status-${status}`}>{status === 'completed' ? 'Credited' : status === 'failed' ? 'Failed' : 'Pending'}</span>
);

const OnlinePaymentPanel = ({
    trip,
    user,
    onStartStripePayment,
    onStartPaypalPayment,
}: {
    trip: Trip;
    user: User;
    onStartStripePayment: (tripId: string, amount: number, description: string) => Promise<void> | void;
    onStartPaypalPayment: (tripId: string, amount: number, description: string) => Promise<void> | void;
}) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState(`${trip.name} befizetes`);
    const [provider, setProvider] = useState<'stripe' | 'paypal'>('stripe');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            alert('Enter a valid payment amount.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (provider === 'stripe') {
                await Promise.resolve(onStartStripePayment(trip.id, numericAmount, description));
            } else {
                await Promise.resolve(onStartPaypalPayment(trip.id, numericAmount, description));
            }
        } catch (error: any) {
            alert(error?.message || 'Unable to start the payment flow.');
            setIsSubmitting(false);
        }
    };

    return (
        <section className="online-payment-panel">
            <div className="online-payment-copy">
                <span className="online-payment-eyebrow">Online payments</span>
                <h3>Fast payment with automatic crediting</h3>
                <p>
                    After a Stripe or PayPal payment, the system automatically creates the matching finance entry for your traveler profile.
                </p>
                <div className="online-payment-highlights">
                    <div>
                        <strong>Automatic finance entry</strong>
                        <span>The credited payment lands directly in this trip’s finance history.</span>
                    </div>
                    <div>
                        <strong>Secure checkout</strong>
                        <span>The payment is completed in Stripe or PayPal’s own hosted flow.</span>
                    </div>
                </div>
            </div>
            <form className="online-payment-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="online-payment-amount">Amount</label>
                    <input
                        id="online-payment-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 120000"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="online-payment-description">Description</label>
                    <input
                        id="online-payment-description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="provider-toggle" role="tablist" aria-label="Payment provider">
                    <button type="button" className={provider === 'stripe' ? 'active' : ''} onClick={() => setProvider('stripe')}>Stripe</button>
                    <button type="button" className={provider === 'paypal' ? 'active' : ''} onClick={() => setProvider('paypal')}>PayPal</button>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Redirecting...' : `Continue with ${provider === 'stripe' ? 'Stripe' : 'PayPal'}`}
                </button>
                <p className="online-payment-note">Once payment succeeds, the credit is recorded automatically for this trip.</p>
            </form>
        </section>
    );
};

const TripFinancials = ({
    trip,
    user,
    records,
    users,
    paymentTransactions,
    onAddRecord,
    onUpdateRecord,
    onRemoveRecord,
    onStartStripePayment,
    onStartPaypalPayment
}: {
    trip: Trip;
    user: User;
    records: FinancialRecord[];
    users: User[];
    paymentTransactions: PaymentTransaction[];
    onAddRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void> | void;
    onUpdateRecord: (id: string, record: Omit<FinancialRecord, 'id'>) => Promise<void> | void;
    onRemoveRecord: (id: string) => Promise<void> | void;
    onStartStripePayment: (tripId: string, amount: number, description: string) => Promise<void> | void;
    onStartPaypalPayment: (tripId: string, amount: number, description: string) => Promise<void> | void;
}) => {

    const isStaff = user.role === 'admin' || user.role === 'organizer';

    const tripParticipants = useMemo(() => {
        const participantIds = new Set([...trip.organizerIds, ...trip.travelerIds]);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

    const tripPaymentTransactions = useMemo(() => {
        return paymentTransactions
            .filter((transaction) => transaction.tripId === trip.id)
            .filter((transaction) => isStaff || transaction.userId === user.id)
            .sort((left, right) => new Date(right.createdAt || '').getTime() - new Date(left.createdAt || '').getTime());
    }, [isStaff, paymentTransactions, trip.id, user.id]);

    const balances = useMemo(() => {
        const userBalances = new Map<string, number>();
        tripParticipants.forEach(p => userBalances.set(p.id, 0));
        records.forEach(r => {
            if (userBalances.has(r.userId)) {
                userBalances.set(r.userId, userBalances.get(r.userId)! + r.amount);
            }
        });
        return userBalances;
    }, [records, tripParticipants]);
    
    // Form state for admin/organizer
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense' | 'payment'>('expense');
    const [selectedUserId, setSelectedUserId] = useState<string>(tripParticipants[0]?.id || '');
    const [isAdding, setIsAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState<'expense' | 'payment'>('expense');
    const [editUserId, setEditUserId] = useState('');
    const [editDate, setEditDate] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        if (tripParticipants.length > 0 && !tripParticipants.find(p => p.id === selectedUserId)) {
            setSelectedUserId(tripParticipants[0].id);
        }
    }, [trip.id, tripParticipants, selectedUserId]);

    const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!description || isNaN(numericAmount) || !selectedUserId) {
            alert("Please complete all fields with valid values.");
            return;
        }

        setIsAdding(true);
        try {
            await Promise.resolve(onAddRecord({
                tripId: trip.id,
                userId: selectedUserId,
                description,
                amount: type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount),
                date: new Date().toISOString().split('T')[0]
            }));
            setDescription('');
            setAmount('');
        } catch (error: any) {
            alert(error?.message || 'Unable to add the finance record.');
        } finally {
            setIsAdding(false);
        }
    };

    const startEditRecord = (record: FinancialRecord) => {
        setEditingId(record.id);
        setEditDescription(record.description);
        setEditAmount(Math.abs(record.amount).toString());
        setEditType(record.amount >= 0 ? 'payment' : 'expense');
        setEditUserId(record.userId || tripParticipants[0]?.id || '');
        setEditDate(record.date || new Date().toISOString().split('T')[0]);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        const numericAmount = parseFloat(editAmount);
        if (!editDescription || isNaN(numericAmount) || !editUserId || !editDate) {
            alert('Please complete all fields with valid values.');
            return;
        }
        setIsSavingEdit(true);
        try {
            await Promise.resolve(onUpdateRecord(editingId, {
                tripId: trip.id,
                userId: editUserId,
                description: editDescription,
                amount: editType === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount),
                date: editDate,
            }));
            setEditingId(null);
        } catch (error: any) {
            alert(error?.message || 'Unable to update this finance record.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!window.confirm('Delete this finance record?')) {
            return;
        }
        try {
            await Promise.resolve(onRemoveRecord(recordId));
            if (editingId === recordId) {
                setEditingId(null);
            }
        } catch (error: any) {
            alert(error?.message || 'Unable to delete this finance record.');
        }
    };

    const visibleRecords = useMemo(() => {
        return records
            .filter((record) => user.role !== 'traveler' || record.userId === user.id)
            .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
    }, [records, user.id, user.role]);

    return (
        <div className="financials-page">
            <div className="financials-hero">
                <div>
                    <span className="section-eyebrow">Finance desk</span>
                    <h2>Finance: {trip.name}</h2>
                    <p className="section-intro">Track manual finance records, online credits, and participant balances from one clean workspace.</p>
                </div>
                <div className="financials-hero-cards">
                    <div className="summary-card compact">
                        <h4>Total transactions</h4>
                        <p className="balance">{records.length}</p>
                    </div>
                    <div className="summary-card compact">
                        <h4>Online payments</h4>
                        <p className="balance">{tripPaymentTransactions.length}</p>
                    </div>
                </div>
            </div>

            {!isStaff && (
                <OnlinePaymentPanel
                    trip={trip}
                    user={user}
                    onStartStripePayment={onStartStripePayment}
                    onStartPaypalPayment={onStartPaypalPayment}
                />
            )}

            {isStaff && (
                <>
                    <h3>Balances</h3>
                    <div className="financial-summary">
                        {tripParticipants.map(p => {
                            const balance = balances.get(p.id) || 0;
                            const balanceClass = balance >= 0 ? 'positive' : 'negative';
                            return (
                                <div key={p.id} className="summary-card">
                                    <h4>{p.name}</h4>
                                    <p className={`balance ${balanceClass}`}>{balance.toLocaleString()} HUF</p>
                                </div>
                            )
                        })}
                    </div>

                    <h3>Add manual record</h3>
                    <form className="add-record-form" onSubmit={handleAddRecord}>
                        <div className="form-row">
                             <div className="form-group">
                                <label htmlFor="participant">Participant</label>
                                <select id="participant" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                                    {tripParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="amount">Amount (HUF)</label>
                                <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <div className="radio-group">
                                    <label><input type="radio" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} /> Expense</label>
                                    <label><input type="radio" value="payment" checked={type === 'payment'} onChange={() => setType('payment')} /> Credit</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isAdding}>
                            {isAdding ? 'Saving...' : 'Add record'}
                        </button>
                    </form>
                </>
            )}

            {tripPaymentTransactions.length > 0 && (
                <>
                    <h3>Online payments</h3>
                    <div className="payment-activity-list">
                        {tripPaymentTransactions.slice(0, 8).map((transaction) => {
                            const payer = users.find((candidate) => candidate.id === transaction.userId);
                            return (
                                <article key={transaction.id} className="payment-activity-card">
                                    <div>
                                        <div className="payment-activity-provider">
                                            <strong>{transaction.provider === 'stripe' ? 'Stripe' : 'PayPal'}</strong>
                                            <PaymentStatusBadge status={transaction.status} />
                                        </div>
                                        <h4>{transaction.description}</h4>
                                        <p>{payer?.name || 'Unknown user'}</p>
                                    </div>
                                    <div className="payment-activity-meta">
                                        <strong>{transaction.amount.toLocaleString()} {transaction.currency}</strong>
                                        <span>{transaction.completedAt ? new Date(transaction.completedAt).toLocaleString('en-GB') : 'Processing'}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            <h3>Transactions</h3>
            <div className="responsive-table-group">
              <div className="table-container desktop-table">
                <table className="financial-table">
                    <thead>
                        <tr>
                            {isStaff && <th>Participant</th>}
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount (HUF)</th>
                            {isStaff && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRecords.map(r => {
                                const participant = users.find(u => u.id === r.userId);
                                const isEditing = editingId === r.id;
                                return (
                                    <tr key={r.id}>
                                        {isStaff && (
                                            <td>
                                                {isEditing ? (
                                                    <select value={editUserId} onChange={e => setEditUserId(e.target.value)}>
                                                        {editUserId && !tripParticipants.find(p => p.id === editUserId) && (
                                                            <option value={editUserId}>Unknown participant</option>
                                                        )}
                                                        {tripParticipants.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    participant?.name || 'Unknown'
                                                )}
                                            </td>
                                        )}
                                        <td>
                                            {isEditing ? (
                                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                            ) : (
                                                r.date
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                            ) : (
                                                r.description
                                            )}
                                        </td>
                                        <td className={!isEditing ? (r.amount >= 0 ? 'positive' : 'negative') : ''}>
                                            {isEditing ? (
                                                <div className="amount-edit-controls">
                                                    <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                                                    <div className="radio-group compact">
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name={`edit-type-${r.id}`}
                                                                value="expense"
                                                                checked={editType === 'expense'}
                                                                onChange={() => setEditType('expense')}
                                                            />
                                                            Expense
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name={`edit-type-${r.id}`}
                                                                value="payment"
                                                                checked={editType === 'payment'}
                                                                onChange={() => setEditType('payment')}
                                                            />
                                                            Credit
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                r.amount.toLocaleString()
                                            )}
                                        </td>
                                        {isStaff && (
                                            <td>
                                                <div className="financial-actions">
                                                    {isEditing ? (
                                                        <>
                                                            <button type="button" className="icon-button confirm" onClick={handleSaveEdit} disabled={isSavingEdit}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path><polyline points="7 3 7 8 15 8 15 3"></polyline><line x1="10" y1="14" x2="14" y2="14"></line></svg>
                                                                Save
                                                            </button>
                                                            <button type="button" className="icon-button cancel" onClick={handleCancelEdit} disabled={isSavingEdit}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button type="button" className="icon-button" onClick={() => startEditRecord(r)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                                Edit
                                                            </button>
                                                            <button type="button" className="icon-button danger" onClick={() => handleDeleteRecord(r.id)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
              </div>
              <div className="mobile-record-list finance-mobile-list">
                {visibleRecords.map((record) => {
                    const participant = users.find((candidate) => candidate.id === record.userId);
                    const isEditing = editingId === record.id;
                    return (
                        <article key={record.id} className="mobile-record-card finance-record-card">
                            <div className="mobile-record-head">
                                <strong>{record.description}</strong>
                                <span className={record.amount >= 0 ? 'text-positive' : 'text-negative'}>
                                    {record.amount.toLocaleString()} HUF
                                </span>
                            </div>
                            <div className="mobile-record-meta">
                                {isStaff && <span>{participant?.name || 'Unknown participant'}</span>}
                                <span>{record.date}</span>
                                <span>{record.amount >= 0 ? 'Credit' : 'Expense'}</span>
                            </div>
                            {isEditing ? (
                                <div className="mobile-inline-editor">
                                    {isStaff && (
                                        <div className="form-group">
                                            <label>Participant</label>
                                            <select value={editUserId} onChange={e => setEditUserId(e.target.value)}>
                                                {tripParticipants.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                                    </div>
                                    <div className="radio-group compact mobile-type-toggle">
                                        <label>
                                            <input
                                                type="radio"
                                                name={`mobile-edit-type-${record.id}`}
                                                value="expense"
                                                checked={editType === 'expense'}
                                                onChange={() => setEditType('expense')}
                                            />
                                            Expense
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name={`mobile-edit-type-${record.id}`}
                                                value="payment"
                                                checked={editType === 'payment'}
                                                onChange={() => setEditType('payment')}
                                            />
                                            Credit
                                        </label>
                                    </div>
                                    <div className="mobile-record-actions">
                                        <button type="button" className="btn btn-primary btn-small" onClick={handleSaveEdit} disabled={isSavingEdit}>Save</button>
                                        <button type="button" className="btn btn-secondary btn-small" onClick={handleCancelEdit} disabled={isSavingEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                isStaff && (
                                    <div className="mobile-record-actions">
                                        <button type="button" className="btn btn-secondary btn-small" onClick={() => startEditRecord(record)}>Edit</button>
                                        <button type="button" className="btn btn-danger btn-small" onClick={() => handleDeleteRecord(record.id)}>Delete</button>
                                    </div>
                                )
                            )}
                        </article>
                    );
                })}
              </div>
            </div>

            {user.role === 'traveler' && (
                 <div className="financial-summary traveler-summary">
                    <div className="summary-card">
                        <h4>Your balance</h4>
                        <p className={`balance ${(balances.get(user.id) || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {(balances.get(user.id) || 0).toLocaleString()} HUF
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ItineraryItemModal = ({ isOpen, onClose, item, onAdd, onUpdate, canEdit, tripStartDate, tripEndDate, startInEditMode }: {
    isOpen: boolean;
    onClose: () => void;
    item?: ItineraryItem | null;
    onAdd?: (item: Omit<ItineraryItem, 'id' | 'tripId'>) => Promise<void> | void;
    onUpdate?: (id: string, item: Omit<ItineraryItem, 'id' | 'tripId'>) => Promise<void> | void;
    canEdit?: boolean;
    tripStartDate: string;
    tripEndDate: string;
    startInEditMode?: boolean;
}) => {
    // Form state for adding or editing an item
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(tripStartDate);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [timeZone, setTimeZone] = useState('Europe/Budapest');
    const [programType, setProgramType] = useState<'required' | 'free' | 'optional'>('required');
    const [isEditing, setIsEditing] = useState(false);

    const resetForm = () => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description || '');
            setDate(item.startDateTimeLocal.split('T')[0]);
            setStartTime(item.startDateTimeLocal.split('T')[1]);
            setEndTime(item.endDateTimeLocal ? item.endDateTimeLocal.split('T')[1] : '');
            setLocation(item.location || '');
            setTimeZone(item.timeZone);
            setProgramType(item.programType || 'required');
        } else {
            setTitle('');
            setDescription('');
            setDate(tripStartDate);
            setStartTime('09:00');
            setEndTime('');
            setLocation('');
            setTimeZone('Europe/Budapest');
            setProgramType('required');
        }
    };

    useEffect(() => {
        resetForm();
        setIsEditing(Boolean(startInEditMode && item));
    }, [item, isOpen, tripStartDate, startInEditMode]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !startTime || !timeZone) {
            alert('Please complete the required fields.');
            return;
        }
        const payload = {
            title,
            description,
            startDateTimeLocal: `${date}T${startTime}`,
            endDateTimeLocal: endTime ? `${date}T${endTime}` : undefined,
            location,
            timeZone,
            programType
        };
        if (!item) {
            await onAdd?.(payload);
            onClose();
            return;
        }
        await onUpdate?.(item.id, payload);
        setIsEditing(false);
        onClose();
    };

    const isAdding = !item && onAdd;
    const currentItem = isAdding ? null : item;
    const canEditExisting = Boolean(currentItem && onUpdate && canEdit);

    const formatTime = (localDateTime?: string) => localDateTime ? localDateTime.split('T')[1] : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content itinerary-modal-content" onClick={e => e.stopPropagation()}>
                {(isAdding || isEditing) ? (
                    <form onSubmit={handleSubmit}>
                        <h2>{isAdding ? 'Add itinerary item' : 'Edit itinerary item'}</h2>
                        <div className="form-group">
                            <label htmlFor="itemTitle">Title *</label>
                            <input id="itemTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDate">Date *</label>
                            <input id="itemDate" type="date" value={date} onChange={e => setDate(e.target.value)} required min={tripStartDate} max={tripEndDate} />
                        </div>
                        <div className="time-inputs">
                             <div className="form-group">
                                <label htmlFor="itemStartTime">Start time *</label>
                                <input id="itemStartTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="itemEndTime">End time (optional)</label>
                                <input id="itemEndTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemTimeZone">Time zone *</label>
                            <input id="itemTimeZone" type="text" value={timeZone} onChange={e => setTimeZone(e.target.value)} required placeholder="e.g. Europe/Paris" />
                            <small>Use IANA time zone format.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemProgramType">Participation type</label>
                            <select id="itemProgramType" value={programType} onChange={(e) => setProgramType(e.target.value as 'required' | 'free' | 'optional')}>
                                <option value="required">Required</option>
                                <option value="free">Free time</option>
                                <option value="optional">Optional</option>
                            </select>
                            <small>Color coding keeps the schedule easier to scan.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemLocation">Location</label>
                            <input id="itemLocation" type="text" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDescription">Description</label>
                            <textarea id="itemDescription" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => { isAdding ? onClose() : (resetForm(), setIsEditing(false)); }} className="btn btn-secondary">Cancel</button>
                            <button type="submit" className="btn btn-primary">{isAdding ? 'Add item' : 'Save changes'}</button>
                        </div>
                    </form>
                ) : currentItem ? (
                     <div>
                        <div className="modal-header">
                            <h2>{currentItem.title}</h2>
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>{new Date(currentItem.startDateTimeLocal).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                            <p>
                                <strong>{formatTime(currentItem.startDateTimeLocal)}{currentItem.endDateTimeLocal ? ` - ${formatTime(currentItem.endDateTimeLocal)}` : ''}</strong> ({currentItem.timeZone})
                            </p>
                             {currentItem.location && <p><strong>Location:</strong> {currentItem.location}</p>}
                        </div>
                        <div className="modal-body">
                           <p>{currentItem.description || 'No description added yet.'}</p>
                        </div>
                        <div className="modal-actions">
                            {canEditExisting && <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>}
                            <button type="button" onClick={onClose} className="btn btn-primary">Close</button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const TripItinerary = ({ trip, user, items, onAddItem, onUpdateItem, onRemoveItem }: {
    trip: Trip,
    user: User,
    items: ItineraryItem[],
    onAddItem: (item: Omit<ItineraryItem, 'id'>) => Promise<void> | void,
    onUpdateItem: (id: string, item: Omit<ItineraryItem, 'id' | 'tripId'>) => Promise<void> | void,
    onRemoveItem: (id: string) => void
}) => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>(isMobile ? 'list' : 'calendar');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
    const [startEditMode, setStartEditMode] = useState(false);
    const closeSelectedItem = () => {
        setSelectedItem(null);
        setStartEditMode(false);
    };

    const isOrganizer = user.role === 'admin' || user.role === 'organizer';

    useEffect(() => {
        if (isMobile) {
            setViewMode('list');
        }
    }, [isMobile]);

    const tripDays = useMemo(() => {
        const days = [];
        let currentDate = new Date(trip.startDate + 'T00:00:00Z');
        const endDate = new Date(trip.endDate + 'T00:00:00Z');
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return days;
    }, [trip.startDate, trip.endDate]);

    const itemsByDate = useMemo<Record<string, ItineraryItem[]>>(() => {
        const grouped: Record<string, ItineraryItem[]> = {};
        items.forEach(item => {
            const date = item.startDateTimeLocal.split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });
        // Sort items within each day
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => a.startDateTimeLocal.localeCompare(b.startDateTimeLocal));
        });
        return grouped;
    }, [items]);
    
    const handleAddItem = (newItemData: Omit<ItineraryItem, 'id' | 'tripId'>) => {
        onAddItem({ ...newItemData, tripId: trip.id });
    };

    const programTypeLabel = (type?: ItineraryItem['programType']) => {
        switch (type) {
            case 'free':
                return 'Free time';
            case 'optional':
                return 'Optional';
            default:
                return 'Required';
        }
    };

    const programTypeClass = (type?: ItineraryItem['programType']) => `program-type-${type || 'required'}`;

    return (
        <div>
            <SectionIntro
                eyebrow="Trip flow"
                title={`Itinerary: ${trip.name}`}
                description="Keep the schedule easy to follow on desktop and effortless to scan on mobile."
                actions={isOrganizer ? (
                    <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">Add item</button>
                ) : undefined}
            />
            <div className="itinerary-header">
                 <div className="itinerary-controls">
                    <div className="itinerary-view-switcher">
                        <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Calendar</button>
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
                    </div>
                    <div className="itinerary-legend" aria-label="Program type legend">
                        <span className="legend-pill program-type-required">Required</span>
                        <span className="legend-pill program-type-free">Free time</span>
                        <span className="legend-pill program-type-optional">Optional</span>
                    </div>
                 </div>
            </div>

            {items.length === 0 && (
                <div className="no-itinerary-items">
                    <p>No itinerary items have been added to this trip yet.</p>
                </div>
            )}

            {viewMode === 'calendar' && items.length > 0 && (
                <div className="itinerary-calendar-view">
                    {tripDays.map(day => {
                        const dayString = day.toISOString().split('T')[0];
                        const dayItems = itemsByDate[dayString] || [];
                        return (
                            <div key={dayString} className="itinerary-day-column">
                                <h3>
                                    {day.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                    <span className="day-of-week">{day.toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                                </h3>
                                {dayItems.map(item => (
                                    <div key={item.id} className="itinerary-item-card" onClick={() => { setSelectedItem(item); setStartEditMode(false); }}>
                                        {isOrganizer && (
                                            <button
                                                className="delete-item-btn"
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                                                aria-label="Delete item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        )}
                                        {isOrganizer && (
                                            <button
                                                className="edit-item-btn"
                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setStartEditMode(true); }}
                                                aria-label="Edit item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                            </button>
                                        )}
                                        <h4>{item.title}</h4>
                                        <p className={`item-time item-time-badge ${programTypeClass(item.programType)}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                            <span>{item.startDateTimeLocal.split('T')[1]} ({item.timeZone.split('/')[1]})</span>
                                            <span className="program-label">{programTypeLabel(item.programType)}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {viewMode === 'list' && items.length > 0 && (
                 <div className="itinerary-list-view">
                    {(Object.entries(itemsByDate) as [string, ItineraryItem[]][])
                        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                        .map(([date, dateItems]) => (
                        <div key={date} className="itinerary-list-day-group">
                            <h3>{new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                            {dateItems.map(item => (
                                <div key={item.id} className="itinerary-list-item">
                                    <div className="item-time-col">
                                        <div className={`item-time-badge ${programTypeClass(item.programType)} inline`}>
                                            <div>
                                                {item.startDateTimeLocal.split('T')[1]}
                                                {item.endDateTimeLocal && ` - ${item.endDateTimeLocal.split('T')[1]}`}
                                            </div>
                                            <small>({item.timeZone})</small>
                                            <div className="program-label">{programTypeLabel(item.programType)}</div>
                                        </div>
                                    </div>
                                    <div className="item-details-col">
                                        <h4>{item.title}</h4>
                                        <p>{item.location}</p>
                                    </div>
                                    <div className="item-actions">
                                        <button className="btn btn-secondary" onClick={() => { setSelectedItem(item); setStartEditMode(false); }}>Details</button>
                                        {isOrganizer && (
                                            <>
                                                <button className="btn btn-secondary" onClick={() => { setSelectedItem(item); setStartEditMode(true); }}>Edit</button>
                                                <button
                                                    className="delete-item-btn"
                                                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                                                    aria-label="Delete item"
                                                >
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                 </div>
            )}

            <ItineraryItemModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={handleAddItem}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
            />

            <ItineraryItemModal
                isOpen={!!selectedItem}
                onClose={closeSelectedItem}
                item={selectedItem}
                onUpdate={onUpdateItem}
                canEdit={isOrganizer}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
                startInEditMode={startEditMode}
            />
        </div>
    );
};

const UploadDocumentModal = ({ isOpen, onClose, onUpload, tripParticipants, categories, onAddCategory }: {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: { name: string; category: string; visibleTo: 'all' | string[]; file: File }) => Promise<void>;
    tripParticipants: User[];
    categories: string[];
    onAddCategory: (name: string) => void;
}) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(['all']);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!category && categories.length > 0) {
            setCategory(categories[0]);
        }
    }, [categories, category]);

    if (!isOpen) return null;

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from<HTMLOptionElement>(e.target.selectedOptions).map((option) => option.value);
        if (options.includes('all') && selectedUserIds.length < options.length) {
            setSelectedUserIds(['all']);
        } else if (options.length > 1 && options.includes('all')) {
            setSelectedUserIds(options.filter(id => id !== 'all'));
        } else {
            setSelectedUserIds(options);
        }
    };

    const handleAddCategoryClick = () => {
        const newCat = prompt('New category name');
        if (newCat) onAddCategory(newCat);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !file) {
            alert('Please add a name, category, and file before uploading.');
            return;
        }

        const visibleTo: 'all' | string[] = selectedUserIds.includes('all')
            ? 'all'
            : selectedUserIds;

        setIsUploading(true);
        await onUpload({ name, category, visibleTo, file });
        setIsUploading(false);
        onClose();
        setName('');
        setCategory(categories[0] || '');
        setSelectedUserIds(['all']);
        setFile(null);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Upload document</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="docName">Document name</label>
                        <input id="docName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="docCategory">Category</label>
                        <div className="category-select">
                            <select id="docCategory" value={category} onChange={e => setCategory(e.target.value)} required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCategoryClick} className="btn btn-secondary btn-small">+</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="docVisibleTo">Visibility</label>
                        <select id="docVisibleTo" multiple value={selectedUserIds} onChange={handleUserSelect} className="multi-select">
                            <option value="all">Everyone</option>
                            {tripParticipants.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                        <small>Use Ctrl/Cmd to select multiple participants.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="docFile">Choose file</label>
                        <input id="docFile" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isUploading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Uploading…' : 'Upload document'}</button>
                        {isUploading && <span className="upload-loader" />}
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditDocumentModal = ({ doc, isOpen, onClose, onSave, tripParticipants, categories, onAddCategory }: {
    doc: Document;
    isOpen: boolean;
    onClose: () => void;
    onSave: (doc: Document, file?: File) => Promise<void>;
    tripParticipants: User[];
    categories: string[];
    onAddCategory: (name: string) => void;
}) => {
    const [name, setName] = useState(doc.name);
    const [category, setCategory] = useState(doc.category);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(Array.isArray(doc.visibleTo) ? doc.visibleTo : ['all']);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setName(doc.name);
        setCategory(doc.category);
        setSelectedUserIds(Array.isArray(doc.visibleTo) ? doc.visibleTo : ['all']);
        setFile(null);
    }, [doc]);

    if (!isOpen) return null;

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from<HTMLOptionElement>(e.target.selectedOptions).map((option) => option.value);
        if (options.includes('all') && selectedUserIds.length < options.length) {
            setSelectedUserIds(['all']);
        } else if (options.length > 1 && options.includes('all')) {
            setSelectedUserIds(options.filter(id => id !== 'all'));
        } else {
            setSelectedUserIds(options);
        }
    };

    const handleAddCategoryClick = () => {
        const newCat = prompt('New category name');
        if (newCat) onAddCategory(newCat);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const visibleTo: 'all' | string[] = selectedUserIds.includes('all') ? 'all' : selectedUserIds;
        setIsUploading(true);
        await onSave({ ...doc, name, category, visibleTo }, file || undefined);
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Edit document</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="editDocName">Document name</label>
                        <input id="editDocName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocCategory">Category</label>
                        <div className="category-select">
                            <select id="editDocCategory" value={category} onChange={e => setCategory(e.target.value)} required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCategoryClick} className="btn btn-secondary btn-small">+</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocVisibleTo">Visibility</label>
                        <select id="editDocVisibleTo" multiple value={selectedUserIds} onChange={handleUserSelect} className="multi-select">
                            <option value="all">Everyone</option>
                            {tripParticipants.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                        <small>Use Ctrl/Cmd to select multiple participants.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocFile">Replace file</label>
                        <input id="editDocFile" type="file" onChange={handleFileChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isUploading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Saving…' : 'Save changes'}</button>
                        {isUploading && <span className="upload-loader" />}
                    </div>
                </form>
            </div>
        </div>
    );
};

const TripDocuments = ({ trip, user, documents, onAddDocument, onUpdateDocument, onRemoveDocument, users }: {
    trip: Trip;
    user: User;
    documents: Document[];
    onAddDocument: (tripId: string, data: { name: string; category: string; visibleTo: 'all' | string[]; file: File }) => Promise<void>;
    onUpdateDocument: (doc: Document, file?: File) => Promise<void>;
    onRemoveDocument: (id: string) => Promise<void>;
    users: User[];
}) => {
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);
    const [categories, setCategories] = useState<string[]>(['Plane tickets', 'Admission Tickets', 'Boarding Passes']);
    type SortableKeys = 'name' | 'category' | 'uploadDate';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'uploadDate', direction: 'desc' });

    const tripParticipants = useMemo(() => {
        const participantIds = new Set([...trip.organizerIds, ...trip.travelerIds]);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

    useEffect(() => {
        documents.forEach(d => {
            setCategories(prev => prev.includes(d.category) ? prev : [...prev, d.category]);
        });
    }, [documents]);

    const addCategory = (name: string) => {
        setCategories(prev => prev.includes(name) ? prev : [...prev, name]);
    };

    const handleUpload = async (data: { name: string; category: string; visibleTo: 'all' | string[]; file: File }) => {
        await onAddDocument(trip.id, data);
        addCategory(data.category);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this document?')) {
            await onRemoveDocument(id);
        }
    };

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDocuments = useMemo(() => {
        let sortableItems = [...documents];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [documents, sortConfig]);

    // Traveler View
    if (user.role === 'traveler') {
        const travelerVisibleDocs = documents.filter(doc => doc.visibleTo === 'all' || (Array.isArray(doc.visibleTo) && doc.visibleTo.includes(user.id)));
        const docsByCategory = travelerVisibleDocs.reduce((acc, doc) => {
            if (!acc[doc.category]) {
                acc[doc.category] = [];
            }
            acc[doc.category].push(doc);
            return acc;
        }, {} as Record<string, Document[]>);

        return (
             <div>
                <SectionIntro
                    eyebrow="Traveler files"
                    title={`Documents: ${trip.name}`}
                    description="Your trip files are grouped by category so they stay readable on mobile and easy to download."
                />
                {Object.keys(docsByCategory).length > 0 ? (
                    Object.entries(docsByCategory).map(([category, docs]) => (
                        <details key={category} className="document-category-group" open>
                            <summary>{category} <span>{docs.length}</span></summary>
                            <ul className="document-list">
                                {docs.map(doc => (
                                    <li key={doc.id} className="document-item">
                                        <div className="document-item-copy">
                                            <strong>{doc.name}</strong>
                                            <small>Uploaded {doc.uploadDate}</small>
                                        </div>
                                        <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} download className="btn btn-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ))
                ) : (
                    <p>No shared documents are available for this trip yet.</p>
                )}
            </div>
        )
    }

    // Admin & Organizer View
    return (
        <div>
            <SectionIntro
                eyebrow="Trip files"
                title={`Documents: ${trip.name}`}
                description="Keep uploaded files readable on desktop and manageable on mobile with clear visibility and action states."
                actions={<button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">Upload document</button>}
            />
             <div className="responsive-table-group">
              <div className="table-container desktop-table">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')}>Name</th>
                            <th onClick={() => requestSort('category')}>Category</th>
                            <th onClick={() => requestSort('uploadDate')}>Uploaded</th>
                            <th>Visibility</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDocuments.map(doc => {
                            let visibleToText: string;
                            if (Array.isArray(doc.visibleTo)) {
                                visibleToText = users.filter(u => doc.visibleTo.includes(u.id)).map(u => u.name).join(', ');
                            } else {
                                visibleToText = 'Everyone';
                            }
                            return (
                                <tr key={doc.id}>
                                    <td>{doc.name}</td>
                                    <td>{doc.category}</td>
                                    <td>{doc.uploadDate}</td>
                                    <td>{visibleToText}</td>
                                    <td className="actions">
                                        <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" download>Open</a>
                                        <button onClick={() => setEditingDoc(doc)} className="btn btn-secondary btn-small">Edit</button>
                                        <button onClick={() => handleDelete(doc.id)} className="btn btn-danger btn-small">Delete</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
              </div>
              <div className="mobile-record-list">
                {sortedDocuments.map((doc) => {
                    const visibleToText = Array.isArray(doc.visibleTo)
                        ? users.filter(u => doc.visibleTo.includes(u.id)).map(u => u.name).join(', ')
                        : 'Everyone';
                    return (
                        <article key={doc.id} className="mobile-record-card">
                            <div className="mobile-record-head">
                                <strong>{doc.name}</strong>
                                <span>{doc.category}</span>
                            </div>
                            <div className="mobile-record-meta">
                                <span>Uploaded {doc.uploadDate}</span>
                                <span>{visibleToText}</span>
                            </div>
                            <div className="mobile-record-actions">
                                <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" download>Open</a>
                                <button onClick={() => setEditingDoc(doc)} className="btn btn-secondary btn-small">Edit</button>
                                <button onClick={() => handleDelete(doc.id)} className="btn btn-danger btn-small">Delete</button>
                            </div>
                        </article>
                    );
                })}
              </div>
            </div>

            <UploadDocumentModal
                isOpen={isUploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUpload}
                tripParticipants={tripParticipants}
                categories={categories}
                onAddCategory={addCategory}
            />
            {editingDoc && (
                <EditDocumentModal
                    doc={editingDoc}
                    isOpen={!!editingDoc}
                    onClose={() => setEditingDoc(null)}
                    onSave={async (doc, file) => { await onUpdateDocument(doc, file); setEditingDoc(null); addCategory(doc.category); }}
                    tripParticipants={tripParticipants}
                    categories={categories}
                    onAddCategory={addCategory}
                />
            )}
        </div>
    );
};

const TripMessages = ({ trip, user, users, messages, onAddMessage, onUpdateMessage, onRemoveMessage, onMarkRead }: {
    trip: Trip;
    user: User;
    users: User[];
    messages: Message[];
    onAddMessage: (tripId: string, recipientIds: string[], content: string) => void;
    onUpdateMessage: (tripId: string, id: string, recipientIds: string[], content: string) => void;
    onRemoveMessage: (tripId: string, id: string) => void;
    onMarkRead: (id: string) => void;
}) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const selectionRef = React.useRef<Range | null>(null);
    const getCssColor = (variable: string, fallback: string) => {
        if (typeof window === 'undefined') return fallback;
        const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
        return value ? value.trim() : fallback;
    };
    const [recipientIds, setRecipientIds] = useState<string[]>([]);
    const [hasTouchedRecipients, setHasTouchedRecipients] = useState(false);
    const [editing, setEditing] = useState<Message | null>(null);
    const [unreadIds, setUnreadIds] = useState<string[]>([]);
    const [fontFamily, setFontFamily] = useState('Poppins');
    const [textColor, setTextColor] = useState(() => getCssColor('--color-text-primary', '#212529'));
    const [highlightColor, setHighlightColor] = useState(() => getCssColor('--color-surface', '#ffffff'));
    const defaultColorsRef = useRef({ text: getCssColor('--color-text-primary', '#212529'), background: getCssColor('--color-surface', '#ffffff') });

    useEffect(() => {
        const unread = messages.filter(m => !m.readBy.includes(String(user.id))).map(m => m.id);
        if (unread.length > 0) {
            setUnreadIds(prev => Array.from(new Set([...prev, ...unread])));
            unread.forEach(id => onMarkRead(id));
        }
    }, [messages, onMarkRead, user.id]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        try {
            document.execCommand('styleWithCSS', false, 'true');
        } catch (_) {
            // Ignore browsers that do not support this command
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const updateThemeColors = () => {
            const nextText = getCssColor('--color-text-primary', '#212529');
            const nextBackground = getCssColor('--color-surface', '#ffffff');
            setTextColor(prev => (prev === defaultColorsRef.current.text ? nextText : prev));
            setHighlightColor(prev => (prev === defaultColorsRef.current.background ? nextBackground : prev));
            defaultColorsRef.current = { text: nextText, background: nextBackground };
            if (editorRef.current) {
                editorRef.current.style.backgroundColor = nextBackground;
                editorRef.current.style.color = nextText;
            }
        };

        updateThemeColors();
        const observer = new MutationObserver(updateThemeColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const participants = useMemo(() => {
        const orderedIds: string[] = [];
        const seen = new Set<string>();
        [...(trip.organizerIds || []), ...(trip.travelerIds || [])].forEach(id => {
            const strId = String(id);
            if (!seen.has(strId)) {
                seen.add(strId);
                orderedIds.push(strId);
            }
        });
        const orderMap = new Map<string, number>();
        orderedIds.forEach((id, index) => orderMap.set(id, index));
        return users
            .filter(u => orderMap.has(u.id))
            .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
    }, [trip.organizerIds, trip.travelerIds, users]);

    useEffect(() => {
        setRecipientIds(prev => {
            const participantIds = new Set(participants.map(p => p.id));
            const filtered = prev.filter(id => participantIds.has(id));
            if (filtered.length === prev.length) return prev;
            return filtered;
        });
    }, [participants]);

    useEffect(() => {
        if (!hasTouchedRecipients && participants.length > 0) {
            setRecipientIds(participants.map(p => p.id));
        }
    }, [participants, hasTouchedRecipients]);

    const focusEditor = () => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const restoreSelection = () => {
        if (typeof window === 'undefined') return;
        const selection = window.getSelection();
        if (selection && selectionRef.current) {
            selection.removeAllRanges();
            selection.addRange(selectionRef.current);
        }
    };

    const saveSelection = () => {
        if (typeof window === 'undefined') return;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selectionRef.current = selection.getRangeAt(0);
        }
    };

    const applyCommand = (command: string, value?: string) => {
        if (typeof document === 'undefined') return;
        restoreSelection();
        focusEditor();
        if (value !== undefined) {
            document.execCommand(command, false, value);
        } else {
            document.execCommand(command, false);
        }
        saveSelection();
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        if (typeof document === 'undefined') return;
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        restoreSelection();
        focusEditor();
        document.execCommand('insertText', false, text);
        saveSelection();
    };

    const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setFontFamily(value);
        applyCommand('fontName', value);
    };

    const handleTextColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const color = event.target.value;
        setTextColor(color);
        applyCommand('foreColor', color);
    };

    const handleHighlightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const color = event.target.value;
        setHighlightColor(color);
        try {
            applyCommand('hiliteColor', color);
        } catch (_) {
            applyCommand('backColor', color);
        }
    };

    const handleClearFormatting = () => {
        applyCommand('removeFormat');
        applyCommand('unlink');
        applyCommand('fontName', 'Poppins');
        applyCommand('foreColor', defaultColorsRef.current.text);
        try {
            applyCommand('hiliteColor', defaultColorsRef.current.background);
        } catch (_) {
            applyCommand('backColor', defaultColorsRef.current.background);
        }
        setFontFamily('Poppins');
        setTextColor(defaultColorsRef.current.text);
        setHighlightColor(defaultColorsRef.current.background);
    };

    const handleSend = () => {
        const html = editorRef.current?.innerHTML || '';
        if (!recipientIds.length) {
            alert('Choose at least one recipient before sending.');
            return;
        }
        if (html.trim()) {
            if (editing) {
                onUpdateMessage(trip.id, editing.id, recipientIds, html);
            } else {
                onAddMessage(trip.id, recipientIds, html);
            }
            if (editorRef.current) editorRef.current.innerHTML = '';
            setEditing(null);
            setRecipientIds(participants.map(p => p.id));
            setHasTouchedRecipients(false);
            setFontFamily('Poppins');
            setTextColor(defaultColorsRef.current.text);
            setHighlightColor(defaultColorsRef.current.background);
            selectionRef.current = null;
        }
    };

    const startEdit = (m: Message) => {
        setEditing(m);
        setRecipientIds(m.recipientIds);
        setHasTouchedRecipients(true);
        if (editorRef.current) {
            editorRef.current.innerHTML = m.content;
            focusEditor();
            if (typeof document !== 'undefined' && typeof window !== 'undefined') {
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                selectionRef.current = range;
            }
        }
        setFontFamily('Poppins');
        setTextColor(defaultColorsRef.current.text);
        setHighlightColor(defaultColorsRef.current.background);
    };

    const cancelEdit = () => {
        setEditing(null);
        if (editorRef.current) editorRef.current.innerHTML = '';
        setRecipientIds(participants.map(p => p.id));
        setHasTouchedRecipients(false);
        setFontFamily('Poppins');
        setTextColor(defaultColorsRef.current.text);
        setHighlightColor(defaultColorsRef.current.background);
        selectionRef.current = null;
    };

    const canPost = user.role === 'admin' || (user.role === 'organizer' && trip.organizerIds.includes(String(user.id)));
    const allSelected = participants.length > 0 && participants.every(p => recipientIds.includes(p.id));

    return (
        <div className="trip-messages">
            <SectionIntro
                eyebrow="Trip updates"
                title={`Messages: ${trip.name}`}
                description="Keep communications focused, easy to scan, and clean on both desktop and mobile."
            />
            {canPost && (
                <div className="message-editor-container">
                    <div className="recipient-selector">
                        <label className="recipient-option">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => {
                                    if (allSelected) {
                                        setRecipientIds([]);
                                    } else {
                                        setRecipientIds(participants.map(p => p.id));
                                    }
                                    setHasTouchedRecipients(true);
                                }}
                            />
                            <span>Everyone</span>
                        </label>
                        {participants.map(p => (
                            <label key={p.id} className="recipient-option">
                                <input
                                    type="checkbox"
                                    checked={recipientIds.includes(p.id)}
                                    onChange={() => {
                                        setRecipientIds(prev => prev.includes(p.id)
                                            ? prev.filter(id => id !== p.id)
                                            : [...prev, p.id]);
                                        setHasTouchedRecipients(true);
                                    }}
                                />
                                <span>{p.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="message-toolbar">
                        <button
                            type="button"
                            className="format-btn bold"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => applyCommand('bold')}
                            aria-label="Bold"
                        >
                            B
                        </button>
                        <button
                            type="button"
                            className="format-btn italic"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => applyCommand('italic')}
                            aria-label="Italic"
                        >
                            I
                        </button>
                        <button
                            type="button"
                            className="format-btn underline"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => applyCommand('underline')}
                            aria-label="Underline"
                        >
                            U
                        </button>
                        <select
                            className="font-select"
                            value={fontFamily}
                            onChange={handleFontChange}
                            aria-label="Font family"
                        >
                            <option value="Poppins">Poppins</option>
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                        </select>
                        <input
                            type="color"
                            className="color-input"
                            value={textColor}
                            onChange={handleTextColorChange}
                            aria-label="Text color"
                            title="Text color"
                        />
                        <input
                            type="color"
                            className="color-input"
                            value={highlightColor}
                            onChange={handleHighlightChange}
                            aria-label="Highlight color"
                            title="Highlight color"
                        />
                        <button
                            type="button"
                            className="format-btn clear"
                            onMouseDown={event => event.preventDefault()}
                            onClick={handleClearFormatting}
                            aria-label="Clear formatting"
                        >
                            Tx
                        </button>
                    </div>
                    <div
                        className="message-editor"
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onPaste={handlePaste}
                        onInput={saveSelection}
                        onKeyUp={saveSelection}
                        onMouseUp={saveSelection}
                        onFocus={saveSelection}
                        onBlur={saveSelection}
                    />
                    <div className="message-actions">
                        <button className="btn btn-primary" onClick={handleSend} disabled={recipientIds.length === 0}>{editing ? 'Save message' : 'Send update'}</button>
                        {editing && <button className="btn" onClick={cancelEdit}>Cancel</button>}
                    </div>
                </div>
            )}
            <div className="messages-list">
                {messages.map(m => {
                    const recips = users.filter(u => m.recipientIds.includes(u.id));
                    const names = recips.map(r => r.name).join(', ');
                    return (
                        <div key={m.id} className={`message-item${unreadIds.includes(m.id) ? ' unread' : ''}`}>
                            <div className="meta">{new Date(m.createdAt).toLocaleString('en-GB')} · {names}</div>
                            <div className="content" dangerouslySetInnerHTML={{ __html: m.content }} />
                            {canPost && (
                                <div className="actions">
                                    <button className="action-btn" onClick={() => startEdit(m)} aria-label="Edit message">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    </button>
                                    <button className="action-btn delete" onClick={() => onRemoveMessage(trip.id, m.id)} aria-label="Delete message">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TripPersonalData = ({ trip, user, records, configs, onUpdateRecord, onToggleLock, onUpsertConfig, onRemoveConfig, users }: {
    trip: Trip;
    user: User;
    records: PersonalDataRecord[];
    configs: PersonalDataFieldConfig[];
    onUpdateRecord: (record: PersonalDataUpdatePayload) => Promise<void>;
    onToggleLock: (userId: string, fieldId: string) => void;
    onUpsertConfig: (config: PersonalDataFieldConfig) => void;
    onRemoveConfig: (id: string, tripId: string) => void;
    users: User[];
}) => {

    const tripParticipants = useMemo(() => {
        const orderedIds: string[] = [];
        const seen = new Set<string>();
        [...(trip.organizerIds || []), ...(trip.travelerIds || [])].forEach(id => {
            const stringId = String(id);
            if (!seen.has(stringId)) {
                seen.add(stringId);
                orderedIds.push(stringId);
            }
        });
        const orderMap = new Map<string, number>();
        orderedIds.forEach((id, index) => orderMap.set(id, index));
        return users
            .filter(u => orderMap.has(u.id))
            .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
    }, [trip, users]);

    const [showPassportReader, setShowPassportReader] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const saveStatusTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
                saveStatusTimeoutRef.current = null;
            }
        };
    }, []);
    const handlePassportResult = (data: MrzResult, setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>) => {
        setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            issuingCountry: data.issuingCountry || prev.issuingCountry,
            passportNumber: data.passportNumber || prev.passportNumber,
            nationality: data.citizenship || prev.nationality,
            dateOfBirth: data.birthDate || prev.dateOfBirth,
            sex: data.gender || prev.sex,
            expiryDate: data.expiryDate || prev.expiryDate,
        }));
    };

    // Traveler View
    if (user.role === 'traveler') {
        const [formData, setFormData] = useState<Record<string, string>>(() => {
            const data: Record<string, string> = {};
            configs.filter(c => c.enabled !== false).forEach(config => {
                const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                data[config.id] = record?.value || '';
            });
            return data;
        });
        const [uploadingField, setUploadingField] = useState<string | null>(null);
        const [deletingField, setDeletingField] = useState<string | null>(null);
        const [isSaving, setIsSaving] = useState(false);

        const showStatus = (status: { type: 'success' | 'error'; message: string }) => {
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
                saveStatusTimeoutRef.current = null;
            }
            setSaveStatus(status);
            saveStatusTimeoutRef.current = window.setTimeout(() => {
                setSaveStatus(null);
                saveStatusTimeoutRef.current = null;
            }, 5000);
        };

        const getFileName = (p: string) => p.split('/').pop() || p;

        const handleChange = (fieldId: string, value: string) => {
            setFormData(prev => ({ ...prev, [fieldId]: value }));
        };

        const handleOptionToggle = (fieldId: string, option: string, checked: boolean) => {
            setFormData(prev => {
                const current = prev[fieldId] ? prev[fieldId].split(',').filter(Boolean) : [];
                const next = checked ? [...current, option] : current.filter(o => o !== option);
                return { ...prev, [fieldId]: next.join(',') };
            });
        };

        const handleFileChange = async (fieldId: string, file: File | null) => {
            if (file && user.token) {
                const formDataData = new FormData();
                formDataData.append('file', file);
                setUploadingField(fieldId);
                try {
                    const res = await fetch(`${API_BASE}/api/users/${user.id}/personal-data/${fieldId}/file`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${user.token}` },
                        body: formDataData
                    });
                    if (!res.ok) {
                        throw new Error('upload_failed');
                    }
                    const data = await res.json();
                    setFormData(prev => ({ ...prev, [fieldId]: data.path }));
                    await onUpdateRecord({ userId: user.id, fieldId, value: data.path, tripId: trip.id });
                } catch (_) {
                    showStatus({ type: 'error', message: 'File upload failed. Please try again.' });
                }
                setUploadingField(null);
            }
        };

        const handleFileDelete = async (fieldId: string) => {
            if (!user.token) return;
            setDeletingField(fieldId);
            const previousValue = formData[fieldId];
            try {
                const res = await fetch(`${API_BASE}/api/users/${user.id}/personal-data/${fieldId}/file`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                if (!res.ok) {
                    throw new Error('delete_failed');
                }
                setFormData(prev => ({ ...prev, [fieldId]: '' }));
                await onUpdateRecord({ userId: user.id, fieldId, value: '', tripId: trip.id });
                showStatus({ type: 'success', message: 'File removed. Upload a replacement whenever you are ready.' });
            } catch (error) {
                console.error(error);
                setFormData(prev => ({ ...prev, [fieldId]: previousValue }));
                showStatus({ type: 'error', message: 'File removal failed. Please try again.' });
            } finally {
                setDeletingField(null);
            }
        };

        const handleBlur = (fieldId: string) => {
            onUpdateRecord({ userId: user.id, fieldId, value: formData[fieldId], tripId: trip.id })
                .catch(() => {
                    showStatus({ type: 'error', message: 'We could not save that field. Please try again.' });
                });
        };

        const handleSave = async () => {
            setIsSaving(true);
            if (saveStatusTimeoutRef.current) {
                clearTimeout(saveStatusTimeoutRef.current);
                saveStatusTimeoutRef.current = null;
            }
            setSaveStatus(null);
            try {
                const lockedFieldIds = new Set(
                    records
                        .filter(r => r.userId === user.id && r.isLocked)
                        .map(r => r.fieldId)
                );
                const promises = configs
                    .filter(c => c.enabled !== false && c.type !== 'file')
                    .filter(c => !lockedFieldIds.has(c.id) && !c.locked)
                    .map(cfg => {
                        const value = formData[cfg.id] || '';
                        return onUpdateRecord({ userId: user.id, fieldId: cfg.id, value, tripId: trip.id });
                    });
                await Promise.all(promises);
                showStatus({ type: 'success', message: 'Personal data saved successfully.' });
            } catch (error) {
                console.error(error);
                showStatus({ type: 'error', message: 'Saving failed. Please try again.' });
            } finally {
                setIsSaving(false);
            }
        };
        
        const passportConfigs = configs.filter(c => c.enabled !== false && c.section === 'passport').slice().sort((a,b)=>(a.order||0)-(b.order||0));
        const generalConfigs = configs.filter(c => c.enabled !== false && c.section !== 'passport').slice().sort((a,b)=>(a.order||0)-(b.order||0));

        const renderInput = (config: PersonalDataFieldConfig, isLocked: boolean) => (
            config.type === 'file' ? (
                <div>
                    <input
                        id={config.id}
                        type="file"
                        onChange={e => {
                            const inputEl = e.target;
                            const nextFile = inputEl.files ? inputEl.files[0] : null;
                            void handleFileChange(config.id, nextFile).finally(() => {
                                inputEl.value = '';
                            });
                        }}
                        disabled={isLocked || uploadingField === config.id || deletingField === config.id}
                    />
                    {(uploadingField === config.id || deletingField === config.id) && <span className="upload-loader" />}
                    {formData[config.id] && (
                        <div className="file-info">
                            Uploaded: <a href={`${API_BASE}/api/users/${user.id}/personal-data/${config.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer">{getFileName(formData[config.id])}</a>
                            <button
                                type="button"
                                className="btn remove-file-btn"
                                onClick={() => handleFileDelete(config.id)}
                                disabled={isLocked || deletingField === config.id || uploadingField === config.id}
                            >
                                Remove file
                            </button>
                        </div>
                    )}
                </div>
            ) : config.type === 'radio' ? (
                <div className="options-group">
                    {config.options?.map(opt => (
                        <label key={opt}>
                            <input
                                type="radio"
                                name={config.id}
                                value={opt}
                                checked={formData[config.id] === opt}
                                onChange={() => handleChange(config.id, opt)}
                                disabled={isLocked}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            ) : config.type === 'multi' ? (
                <div className="options-group">
                    {config.options?.map(opt => {
                        const selected = (formData[config.id] || '').split(',').includes(opt);
                        return (
                            <label key={opt}>
                                <input
                                    type="checkbox"
                                    value={opt}
                                    checked={selected}
                                    onChange={e => handleOptionToggle(config.id, opt, e.target.checked)}
                                    disabled={isLocked}
                                />
                                {opt}
                            </label>
                        );
                    })}
                </div>
            ) : (
                 <input
                    id={config.id}
                    type={config.type}
                    value={formData[config.id] || ''}
                    onChange={e => handleChange(config.id, e.target.value)}
                    onBlur={() => handleBlur(config.id)}
                    readOnly={isLocked}
                    placeholder={isLocked ? 'Locked' : ''}
                />
            )
        );

        return (
            <div className="personal-data-page">
                <SectionIntro
                    eyebrow="Traveler profile"
                    title={`Personal data: ${trip.name}`}
                    description="Complete your traveler details and travel documents here. The team will use this information to finalize bookings."
                    actions={(
                        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                    )}
                />
                <form className="personal-data-form">
                    {generalConfigs.length > 0 && (
                        <div className="personal-data-grid">
                            {generalConfigs.map(config => {
                                const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                                const isLocked = Boolean(config.locked) || Boolean(record?.isLocked);
                                return (
                                    <div className="form-group" key={config.id}>
                                        <label htmlFor={config.id}>{config.label}</label>
                                        {renderInput(config, isLocked)}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {passportConfigs.length > 0 && (
                        <div className="passport-box">
                            <div className="passport-box-head">
                                <div>
                                    <span className="passport-box-kicker">Passport</span>
                                    <h3>Passport details</h3>
                                </div>
                                <button type="button" className="btn scan-passport-btn" onClick={() => setShowPassportReader(true)}>Scan passport</button>
                            </div>
                            <div className="personal-data-grid">
                                {passportConfigs.map(config => {
                                    const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                                    const isLocked = Boolean(config.locked) || Boolean(record?.isLocked);
                                    return (
                                        <div className="form-group" key={config.id}>
                                            <label htmlFor={config.id}>{config.label}</label>
                                            {renderInput(config, isLocked)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {showPassportReader && (
                        <PassportReaderModal onClose={() => setShowPassportReader(false)} onResult={(d) => handlePassportResult(d, setFormData)} />
                    )}
                    <div className="personal-data-actions">
                        {saveStatus && (
                            <span className={`personal-data-save-status ${saveStatus.type}`}>
                                {saveStatus.message}
                            </span>
                        )}
                        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                        {isSaving && <span className="upload-loader" />}
                    </div>
                </form>
            </div>
        );
    }

    // Admin & Organizer View
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>(() => tripParticipants[0]?.id || "");

    useEffect(() => {
        if (tripParticipants.length > 0 && !tripParticipants.find(p => p.id === selectedParticipantId)) {
            setSelectedParticipantId(tripParticipants[0].id);
        }
    }, [tripParticipants, selectedParticipantId]);

    const BASIC_FIELD_IDS = ['firstName', 'lastName', 'middleName', 'dateOfBirth', 'passportNumber', 'issueDate', 'issuingCountry', 'expiryDate', 'nationality', 'sex'];

    const [localConfigs, setLocalConfigs] = useState<PersonalDataFieldConfig[]>([]);
    const [availableFields, setAvailableFields] = useState<PersonalDataFieldConfig[]>([]);
    useEffect(() => {
        const relevant = configs.filter(c => c.tripId === trip.id || c.tripId === 'default');
        const map = new Map<string, PersonalDataFieldConfig>();
        relevant.forEach(c => {
            if (c.tripId === trip.id || !map.has(c.id)) {
                map.set(c.id, c);
            }
        });
        const merged = Array.from(map.values());
        setLocalConfigs(merged.filter(c => c.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0)));
        setAvailableFields(merged.filter(c => c.enabled === false && BASIC_FIELD_IDS.includes(c.id)).sort((a,b)=>(a.order||0)-(b.order||0)));
    }, [configs, trip.id]);

    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState<'text' | 'date' | 'file' | 'radio' | 'multi'>('text');
    const [newFieldOptions, setNewFieldOptions] = useState('');
    const [fieldManagerOpen, setFieldManagerOpen] = useState(false);

    const handleAddField = () => {
        const id = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!id) return;
        fetch(`${API_BASE}/api/field-config/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: newFieldLabel, type: newFieldType, enabled: true, locked: false, tripId: trip.id, order: localConfigs.length + 1, options: (newFieldType === 'radio' || newFieldType === 'multi') ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : [], section: 'general' })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order, options: c.options, section: c.section });
            setNewFieldLabel('');
            setNewFieldType('text');
            setNewFieldOptions('');
        }).catch(() => {});
    };

    const handleEnableField = (cfg: PersonalDataFieldConfig) => {
        fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: true, locked: cfg.locked, tripId: trip.id, order: localConfigs.length + 1, options: cfg.options || [], section: cfg.section })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order, options: c.options, section: c.section });
        }).catch(() => {});
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editType, setEditType] = useState<'text' | 'date' | 'file' | 'radio' | 'multi'>('text');
    const [editOptions, setEditOptions] = useState('');

    const startEdit = (cfg: PersonalDataFieldConfig) => {
        setEditingId(cfg.id);
        setEditLabel(cfg.label);
        setEditType(cfg.type);
        setEditOptions((cfg.options || []).join(','));
    };

    const saveEdit = (cfg: PersonalDataFieldConfig) => {
        fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: editLabel, type: editType, enabled: true, locked: cfg.locked, tripId: trip.id, order: cfg.order, options: (editType === 'radio' || editType === 'multi') ? editOptions.split(',').map(o => o.trim()).filter(Boolean) : [], section: cfg.section })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order, options: c.options, section: c.section });
            setEditingId(null);
        }).catch(() => {});
    };

    const cancelEdit = () => setEditingId(null);

    const handleDeleteField = (cfg: PersonalDataFieldConfig) => {
        if (cfg.locked) return;
        if (BASIC_FIELD_IDS.includes(cfg.id)) {
            fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: false, locked: cfg.locked, tripId: trip.id, order: cfg.order, options: cfg.options || [], section: cfg.section })
            }).then(res => res.json()).then(c => {
                onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order, options: c.options, section: c.section });
            }).catch(() => {});
        } else {
            fetch(`${API_BASE}/api/field-config/${cfg.id}?tripId=${trip.id}`, { method: 'DELETE' })
                .then(() => onRemoveConfig(cfg.id, trip.id))
                .catch(() => {});
        }
    };

    const handleOrderChange = (id: string, order: number) => {
        const cfg = localConfigs.find(c => c.id === id) || availableFields.find(c => c.id === id);
        if (!cfg) return;
        fetch(`${API_BASE}/api/field-config/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: cfg.enabled !== false, locked: cfg.locked, tripId: trip.id, order, options: cfg.options || [], section: cfg.section })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order, options: c.options, section: c.section });
        }).catch(() => {});
    };

    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const onDragStart = (index: number) => {
        setDragIndex(index);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = (index: number) => {
        if (dragIndex === null) return;
        const updated = [...localConfigs];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, moved);
        updated.forEach((cfg, idx) => {
            if (cfg.order !== idx + 1) {
                handleOrderChange(cfg.id, idx + 1);
            }
        });
        setLocalConfigs(updated.map((cfg, idx) => ({ ...cfg, order: idx + 1 })));
        setDragIndex(null);
    };

    const handleRemoveFile = (userId: string, fieldId: string) => {
        if (!user.token) return;
        fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/file`, { method: 'DELETE', headers: { Authorization: `Bearer ${user.token}` } })
            .then(() => onUpdateRecord({ userId, fieldId, value: '', tripId: trip.id }).catch(() => {}))
            .catch(() => {});
    };

    const handleTravelerFileChange = async (userId: string, fieldId: string, file: File | null) => {
        if (file && user.token) {
            const fd = new FormData();
            fd.append('file', file);
            try {
                const res = await fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/file`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${user.token}` },
                    body: fd
                });
                if (!res.ok) {
                    throw new Error('upload_failed');
                }
                const data = await res.json();
                await onUpdateRecord({ userId, fieldId, value: data.path, tripId: trip.id }).catch(() => {});
            } catch (_) {}
        }
    };

    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [draftValues, setDraftValues] = useState<Record<string, string>>({});

    const startFieldEdit = (fieldId: string, value: string) => {
        setEditingFieldId(fieldId);
        setDraftValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleDraftChange = (fieldId: string, value: string) => {
        setDraftValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const saveFieldEdit = async (userId: string, fieldId: string) => {
        const value = draftValues[fieldId] || '';
        try {
            await onUpdateRecord({ userId, fieldId, value, tripId: trip.id });
            setEditingFieldId(null);
        } catch (_) {}
    };

    const [remarkEditing, setRemarkEditing] = useState(false);
    const [remarkValue, setRemarkValue] = useState('');

    const startRemarkEdit = (value: string) => {
        setRemarkEditing(true);
        setRemarkValue(value);
    };

    const saveRemark = async (userId: string) => {
        try {
            await onUpdateRecord({ userId, fieldId: 'remark', value: remarkValue, tripId: trip.id });
            setRemarkEditing(false);
        } catch (_) {}
    };

    const handlePrint = () => window.print();

    if (tripParticipants.length === 0) {
        return (
            <div className="personal-data-page">
                <SectionIntro
                    eyebrow="Participant records"
                    title={`Participant data: ${trip.name}`}
                    description="This workspace becomes available once travelers are assigned to the trip."
                />
                <p>No participants have been assigned to this trip yet.</p>
            </div>
        );
    }

    const participant = tripParticipants.find(p => p.id === selectedParticipantId);

    const generalFieldConfigs = localConfigs.filter(c => c.section !== 'passport');
    const passportFieldConfigs = localConfigs.filter(c => c.section === 'passport');

    const applyPassportToParticipant = (data: MrzResult) => {
        if (!participant) return;
        const mapping: Record<string, string> = {
            firstName: 'firstName',
            lastName: 'lastName',
            issuingCountry: 'issuingCountry',
            passportNumber: 'passportNumber',
            citizenship: 'nationality',
            birthDate: 'dateOfBirth',
            gender: 'sex',
            expiryDate: 'expiryDate',
        };
        Object.entries(mapping).forEach(([key, fieldId]) => {
            const value = (data as any)[key];
            if (value) {
                onUpdateRecord({ userId: participant.id, fieldId, value, tripId: trip.id }).catch(() => {});
            }
        });
    };

    const renderField = (config: PersonalDataFieldConfig) => {
        if (!participant) return null;
        const record = records.find(r => r.userId === participant.id && r.fieldId === config.id);
        const isEditing = editingFieldId === config.id || !record?.value;
        const draft = draftValues[config.id] ?? record?.value ?? '';
        return (
            <div key={config.id} className={`data-field-group${!record?.value ? ' empty' : ''}`}>
                <div className="data-field-header">
                    <label>{config.label}</label>
                    <div className="field-header-actions">
                        <button
                            className="lock-btn"
                            onClick={() => onToggleLock(participant.id, config.id)}
                            aria-label={record?.isLocked ? 'Unlock field' : 'Lock field'}
                        >
                            {record?.isLocked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            )}
                        </button>
                        {config.type !== 'file' && record?.value && !record?.isLocked && (
                            <button className="edit-btn" onClick={() => startFieldEdit(config.id, record.value)} aria-label="Edit field">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
                            </button>
                        )}
                    </div>
                </div>
                {config.type === 'file' ? (
                    <div className="field-file-card">
                        {record?.value && (
                            <div className="file-info">
                                <a href={`${API_BASE}/api/users/${participant.id}/personal-data/${config.id}/file?token=${user.token || ''}`} className="file-link">{record.value}</a>
                                <button className="btn remove-file-btn" onClick={() => handleRemoveFile(participant.id, config.id)}>Remove file</button>
                            </div>
                        )}
                        {!record?.isLocked && (
                            <input type="file" onChange={e => handleTravelerFileChange(participant.id, config.id, e.target.files ? e.target.files[0] : null)} />
                        )}
                    </div>
                ) : isEditing && !record?.isLocked ? (
                    <div className="field-edit">
                        <input type={config.type} value={draft} onChange={e => handleDraftChange(config.id, e.target.value)} />
                        <button className="save-btn" onClick={() => saveFieldEdit(participant.id, config.id)} aria-label="Save field">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        </button>
                    </div>
                ) : (
                    <div className="field-display">
                        <span className={`data-value${record?.value ? '' : ' empty'}`}>{record?.value || ''}</span>
                    </div>
                )}
                <div className="print-row">
                    <span className="print-label">{config.label}:</span> <span className="print-value">{record?.value}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="personal-data-page">
            <SectionIntro
                eyebrow="Operations data"
                title={`Participant data: ${trip.name}`}
                description="Review traveler details, control locked fields, and manage the form schema without leaving the trip workspace."
                meta={`${tripParticipants.length} participant${tripParticipants.length === 1 ? '' : 's'}`}
            />
            <div className={`field-manager ${fieldManagerOpen ? 'expanded' : 'collapsed'}`}>
                <div className="field-manager-header">
                    <h3>Field manager</h3>
                    <button
                        type="button"
                        className="field-manager-toggle"
                        onClick={() => setFieldManagerOpen(open => !open)}
                        aria-expanded={fieldManagerOpen}
                    >
                        <span>{fieldManagerOpen ? 'Hide' : 'Open'}</span>
                        <svg
                            className="field-manager-toggle-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                </div>
                {!fieldManagerOpen && (
                    <p className="field-manager-hint">Open the field manager to enable, reorder, or edit traveler fields for this trip.</p>
                )}
                {fieldManagerOpen && (
                    <div className="field-manager-body">
                        <div className="config-list">
                            {localConfigs.map((c, index) => (
                                <div
                                    key={c.id}
                                    className="config-item"
                                    draggable={editingId === null}
                                    onDragStart={() => onDragStart(index)}
                                    onDragOver={onDragOver}
                                    onDrop={() => onDrop(index)}
                                >
                                    <span className="drag-handle">☰</span>
                                    {editingId === c.id ? (
                                        <>
                                            <input value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                                            <select value={editType} onChange={e => setEditType(e.target.value as any)}>
                                                <option value="text">Text</option>
                                                <option value="date">Date</option>
                                                <option value="file">File</option>
                                                <option value="radio">Single choice</option>
                                                <option value="multi">Multi choice</option>
                                            </select>
                                            {(editType === 'radio' || editType === 'multi') && (
                                                <input placeholder="Options, comma separated" value={editOptions} onChange={e => setEditOptions(e.target.value)} />
                                            )}
                                            <div className="config-actions">
                                                <button className="btn btn-small" onClick={() => saveEdit(c)}>Save</button>
                                                <button className="btn btn-small" onClick={cancelEdit}>Cancel</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="config-label">{c.label} <small>({c.type})</small></span>
                                            {!c.locked && (
                                                <div className="config-actions">
                                                    <button className="btn btn-small" onClick={() => startEdit(c)}>Edit</button>
                                                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteField(c)}>Remove</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        {availableFields.length > 0 && (
                            <div className="available-fields">
                                {availableFields.map(f => (
                                    <button key={f.id} className="btn btn-secondary btn-small" onClick={() => handleEnableField(f)}>+ {f.label}</button>
                                ))}
                            </div>
                        )}
                        <div className="add-field">
                            <input placeholder="Field label" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
                            <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                                <option value="text">Text</option>
                                <option value="date">Date</option>
                                <option value="file">File</option>
                                <option value="radio">Single choice</option>
                                <option value="multi">Multi choice</option>
                            </select>
                            {(newFieldType === 'radio' || newFieldType === 'multi') && (
                                <input placeholder="Options, comma separated" value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} />
                            )}
                            <button className="btn" onClick={handleAddField}>Add field</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="traveler-select">
                <label htmlFor="travelerSelect">Participant</label>
                <select
                    id="travelerSelect"
                    value={selectedParticipantId}
                    onChange={e => setSelectedParticipantId(e.target.value)}
                >
                    {tripParticipants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            {participant && (
                <div className="participant-data-card">
                    <h3>{participant.name}</h3>
                    {generalFieldConfigs.map(renderField)}
                    {passportFieldConfigs.length > 0 && (
                        <div className="passport-box">
                            <div className="passport-box-head">
                                <div>
                                    <span className="passport-box-kicker">Passport</span>
                                    <h4>Passport workspace</h4>
                                </div>
                                <button type="button" className="btn scan-passport-btn" onClick={() => setShowPassportReader(true)}>Scan passport</button>
                            </div>
                            {passportFieldConfigs.map(renderField)}
                        </div>
                    )}
                    {showPassportReader && (
                        <PassportReaderModal onClose={() => setShowPassportReader(false)} onResult={applyPassportToParticipant} />
                    )}
                    {(() => {
                        const remarkRecord = records.find(r => r.userId === participant.id && r.fieldId === 'remark');
                        return (
                            <div className="remark-section">
                                <div className="data-field-header">
                                    <label>Internal note</label>
                                    {remarkEditing ? (
                                        <button className="save-btn" onClick={() => saveRemark(participant.id)} aria-label="Save note">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </button>
                                    ) : (
                                        <button className="edit-btn" onClick={() => startRemarkEdit(remarkRecord?.value || '')} aria-label="Edit note">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
                                        </button>
                                    )}
                                </div>
                                {remarkEditing ? (
                                    <textarea value={remarkValue} onChange={e => setRemarkValue(e.target.value)} />
                                ) : (
                                    <p className={`data-value${remarkRecord?.value ? '' : ' empty'}`}>{remarkRecord?.value || ''}</p>
                                )}
                                <div className="print-row">
                                    <span className="print-label">Internal note:</span> <span className="print-value">{remarkRecord?.value}</span>
                                </div>
                            </div>
                        );
                    })()}
                    <div className="personal-data-actions">
                        <button className="btn btn-secondary" onClick={handlePrint}>Print</button>
                        <button className="btn btn-secondary" onClick={handlePrint}>Save PDF</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const AllFilesView = ({ documents, users, trips, user }: { documents: Document[]; users: User[]; trips: Trip[]; user: User }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const filteredDocs = useMemo(() => {
        if (!selectedUser) return documents;
        return documents.filter(d => d.uploadedBy === selectedUser);
    }, [documents, selectedUser]);
    const userName = (id: string) => users.find(u => u.id === id)?.name || '';
    const tripName = (id: string) => trips.find(t => t.id === id)?.name || '';
    return (
        <div className="documents-page">
            <SectionIntro
                eyebrow="File library"
                title="All files"
                description="Browse uploaded files across trips with a mobile-safe card layout and a dense desktop table."
                meta={`${filteredDocs.length} file${filteredDocs.length === 1 ? '' : 's'}`}
            />
            <div className="form-group">
                <label htmlFor="fileUser">Participant filter</label>
                <select id="fileUser" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="">All participants</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
            <div className="table-container desktop-table">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Participant</th>
                            <th>Trip</th>
                            <th>Category</th>
                            <th>Uploaded</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.map(doc => (
                            <tr key={doc.id}>
                                <td>{doc.name}</td>
                                <td>{userName(doc.uploadedBy)}</td>
                                <td>{tripName(doc.tripId)}</td>
                                <td>{doc.category}</td>
                                <td>{doc.uploadDate}</td>
                                <td><a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer">Open</a></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mobile-record-list">
                {filteredDocs.map(doc => (
                    <article key={doc.id} className="mobile-record-card">
                        <div className="mobile-record-head">
                            <div>
                                <strong>{doc.name}</strong>
                                <span>{doc.category}</span>
                            </div>
                            <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small">Open</a>
                        </div>
                        <div className="mobile-record-meta">
                            <span>Participant</span>
                            <strong>{userName(doc.uploadedBy) || 'Unknown user'}</strong>
                            <span>Trip</span>
                            <strong>{tripName(doc.tripId) || 'Unknown trip'}</strong>
                            <span>Uploaded</span>
                            <strong>{doc.uploadDate}</strong>
                        </div>
                    </article>
                ))}
            </div>
            {filteredDocs.length === 0 && <p className="no-trips">No files match the current filter.</p>}
        </div>
    );
};

const Sidebar = ({
    trips,
    selectedTripId,
    activeView,
    mainView,
    userRole,
    userId,
    isOpen,
    onClose,
    onNavigate,
    onLogout,
    unreadCounts,
    theme,
    currentTheme,
    onThemeChange,
    logos
}: {
    trips: Trip[],
    selectedTripId: string | null,
    activeView: TripView,
    mainView: MainView,
    userRole: Role,
    userId: string,
    isOpen: boolean,
    onClose: () => void,
    onNavigate: () => void,
    onLogout: () => void,
    unreadCounts: Record<string, number>,
    theme: Theme,
    currentTheme: 'light' | 'dark',
    onThemeChange: (theme: Theme) => void,
    logos: SiteSettings | null
}) => {
    const mainNavItems: NavItem[] = [{ key: 'trips', label: 'Trips' }];

    if (userRole === 'admin' || userRole === 'organizer') {
        mainNavItems.push({ key: 'files', label: 'Files' });
    }

    if (userRole === 'admin') {
        mainNavItems.push({ key: 'users', label: 'People' });
        mainNavItems.push({ key: 'site', label: 'Brand settings' });
    }

    return (
        <aside className={`sidebar sidebar-v2 ${isOpen ? 'is-open' : ''}`}>
            <div className="sidebar-mobile-head-v2">
                <div className="sidebar-logo sidebar-logo-v2">
                    <span className="sidebar-brand-label">Travel ops</span>
                    <h2>myTrip</h2>
                </div>
                <button type="button" className="sidebar-close-btn-v2" onClick={onClose} aria-label="Close navigation">
                    ×
                </button>
            </div>
            <nav>
                <div className="sidebar-section-label">Workspace</div>
                <ul className="main-nav-list">
                    {mainNavItems.map((item) => {
                        return (
                            <li key={item.key} className="nav-item">
                                <Link
                                    to={getMainViewPath(item.key)}
                                    onClick={onNavigate}
                                    className={mainView === item.key ? 'active' : ''}
                                >
                                    {item.label}
                                </Link>
                                {item.key === 'trips' && mainView === 'trips' && (
                                    <ul className="trip-nav-list">
                                        {trips.map((trip) => {
                                            const tripNavItems = getTripNavItems(trip, userRole, userId);
                                            return (
                                                <li key={trip.id} className={`trip-item ${trip.id === selectedTripId ? 'active' : ''}`}>
                                                    <Link to={getTripPath(trip.id)} onClick={onNavigate}>
                                                        {trip.name}
                                                    </Link>
                                                    {trip.id === selectedTripId && (
                                                        <ul className="trip-submenu">
                                                            {tripNavItems.map((submenuItem) => (
                                                                <li key={submenuItem.key}>
                                                                    <Link
                                                                        to={getTripPath(trip.id, submenuItem.key)}
                                                                        onClick={onNavigate}
                                                                        className={activeView === submenuItem.key ? 'active' : ''}
                                                                    >
                                                                        {submenuItem.label}
                                                                        {submenuItem.key === 'messages' && unreadCounts[trip.id] > 0 && (
                                                                            <span className="unread-badge">{unreadCounts[trip.id]}</span>
                                                                        )}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <Link
                    to={getMainViewPath('account')}
                    onClick={onNavigate}
                    className={mainView === 'account' ? 'active' : ''}
                >
                    Account
                </Link>
                <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
                <button onClick={onLogout} className="btn btn-logout">Sign out</button>
            </div>
        </aside>
    );
};

const TripSubnav = ({
    trip,
    user,
    activeView,
    unreadCount,
    onSelectView,
}: {
    trip: Trip;
    user: User;
    activeView: TripView;
    unreadCount: number;
    onSelectView: (view: TripView) => void;
}) => {
    const items = getTripNavItems(trip, user.role, String(user.id));

    return (
        <div className="trip-mobile-subnav">
            <div className="trip-mobile-subnav-head">
                <span className="trip-mobile-subnav-label">Current trip</span>
                <strong>{trip.name}</strong>
            </div>
            <div className="trip-mobile-subnav-scroll" role="tablist" aria-label="Trip sections">
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={activeView === item.key ? 'active' : ''}
                        onClick={() => onSelectView(item.key)}
                    >
                        {item.label}
                        {item.key === 'messages' && unreadCount > 0 && (
                            <span className="trip-mobile-subnav-badge">{unreadCount}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

const MobileBottomNav = ({
    role,
    mainView,
    selectedTrip,
    activeTripView,
    onShowHome,
    onOpenTrip,
    onOpenMessages,
    onShowFiles,
    onShowAccount,
    onOpenMore,
}: {
    role: Role;
    mainView: MainView;
    selectedTrip: Trip | null;
    activeTripView: TripView;
    onShowHome: () => void;
    onOpenTrip: () => void;
    onOpenMessages: () => void;
    onShowFiles: () => void;
    onShowAccount: () => void;
    onOpenMore: () => void;
}) => {
    const items = getPrimaryMobileNavItems(role);

    const isActive = (key: string) => {
        if (key === 'home') {
            return mainView === 'trips' && !selectedTrip;
        }
        if (key === 'trips') {
            return mainView === 'trips' && Boolean(selectedTrip) && activeTripView !== 'messages';
        }
        if (key === 'messages') {
            return mainView === 'trips' && activeTripView === 'messages';
        }
        if (key === 'files') {
            return mainView === 'files';
        }
        if (key === 'account') {
            return mainView === 'account';
        }
        return false;
    };

    return (
        <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
            {items.map((item) => {
                const onClick = () => {
                    if (item.key === 'home') onShowHome();
                    if (item.key === 'trips') onOpenTrip();
                    if (item.key === 'messages') onOpenMessages();
                    if (item.key === 'files') onShowFiles();
                    if (item.key === 'account') onShowAccount();
                    if (item.key === 'more') onOpenMore();
                };

                return (
                    <button key={item.key} type="button" className={isActive(item.key) ? 'active' : ''} onClick={onClick}>
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};


const Dashboard = ({
    user, trips, refreshTrips, onLogout, onCreateTrip,
    financialRecords, paymentTransactions, onAddFinancialRecord, onUpdateFinancialRecord, onRemoveFinancialRecord, onStartStripePayment, onStartPaypalPayment,
    documents, onAddDocument, onUpdateDocument, onRemoveDocument,
    personalDataConfigs, personalDataRecords, onUpdatePersonalData, onTogglePersonalDataLock, onUpsertPersonalDataConfig, onRemovePersonalDataConfig,
    itineraryItems, onAddItineraryItem, onUpdateItineraryItem, onRemoveItineraryItem,
    messages, onAddMessage, onUpdateMessage, onRemoveMessage, onMarkMessageRead,
    theme, onThemeChange, currentTheme, paymentFeedback, onDismissPaymentFeedback
}: {
    user: User,
    trips: Trip[],
    refreshTrips: () => void,
    onLogout: () => void,
    onCreateTrip: (trip: Trip) => void,
    financialRecords: FinancialRecord[],
    paymentTransactions: PaymentTransaction[],
    onAddFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void> | void,
    onUpdateFinancialRecord: (id: string, record: Omit<FinancialRecord, 'id'>) => Promise<void> | void,
    onRemoveFinancialRecord: (id: string) => Promise<void> | void,
    onStartStripePayment: (tripId: string, amount: number, description: string) => Promise<void> | void,
    onStartPaypalPayment: (tripId: string, amount: number, description: string) => Promise<void> | void,
    documents: Document[],
    onAddDocument: (tripId: string, data: { name: string; category: string; visibleTo: 'all' | string[]; file: File }) => Promise<void>,
    onUpdateDocument: (doc: Document, file?: File) => Promise<void>,
    onRemoveDocument: (id: string) => Promise<void>,
    personalDataConfigs: PersonalDataFieldConfig[],
    personalDataRecords: PersonalDataRecord[],
    onUpdatePersonalData: (record: PersonalDataUpdatePayload) => Promise<void>,
    onTogglePersonalDataLock: (userId: string, fieldId: string) => void,
    onUpsertPersonalDataConfig: (config: PersonalDataFieldConfig) => void,
    onRemovePersonalDataConfig: (id: string, tripId: string) => void,
    itineraryItems: ItineraryItem[],
    onAddItineraryItem: (item: Omit<ItineraryItem, 'id'>) => Promise<void> | void,
    onUpdateItineraryItem: (id: string, item: Omit<ItineraryItem, 'id' | 'tripId'>) => Promise<void> | void,
    onRemoveItineraryItem: (id: string) => void,
    messages: Message[],
    onAddMessage: (tripId: string, recipientIds: string[], content: string) => void,
    onUpdateMessage: (tripId: string, id: string, recipientIds: string[], content: string) => void,
    onRemoveMessage: (tripId: string, id: string) => void,
    onMarkMessageRead: (id: string) => void,
    theme: Theme,
    onThemeChange: (theme: Theme) => void,
    currentTheme: 'light' | 'dark',
    paymentFeedback: { type: 'success' | 'error' | 'info'; message: string } | null,
    onDismissPaymentFeedback: () => void
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteRefresh, setInviteRefresh] = useState(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userRefresh, setUserRefresh] = useState(0);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTabletOrBelow = useMediaQuery('(max-width: 1199px)');
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(m => {
      if (!m.readBy.includes(String(user.id))) {
        counts[m.tripId] = (counts[m.tripId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, user.id]);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/logo`)
      .then(res => res.json())
      .then(setSiteSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isTabletOrBelow) {
      setMobileSidebarOpen(false);
    }
  }, [isTabletOrBelow]);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => setAllUsers(data.map((u: any) => ({
        id: u._id,
        name: u.name,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        contactPhone: u.contactPhone,
        contactEmail: u.contactEmail,
        contactTitle: u.contactTitle,
        contactShowEmergency: u.contactShowEmergency,
        _id: u._id,
      }))))
      .catch(() => {});
  }, [userRefresh]);
    
  const visibleTrips = useMemo<Trip[]>(() => {
    switch(user.role) {
      case 'admin':
        return trips;
      case 'organizer':
        return trips.filter((trip: Trip) =>
          trip.organizerIds.includes(String(user.id)) || trip.travelerIds.includes(String(user.id))
        );
      case 'traveler':
        return trips.filter((trip: Trip) => trip.travelerIds.includes(String(user.id)));
      default:
        return [];
    }
  }, [user, trips]);

  const overviewMetrics = useMemo(() => {
      const visibleTripIds = new Set(visibleTrips.map((trip) => trip.id));
      const unreadMessages = messages.filter((message) => !message.readBy.includes(String(user.id))).length;
      const myBalance = financialRecords
          .filter((record) => visibleTripIds.has(record.tripId))
          .filter((record) => user.role !== 'traveler' || record.userId === user.id)
          .reduce((sum, record) => sum + record.amount, 0);
      const onlinePaymentsCount = paymentTransactions
          .filter((transaction) => visibleTripIds.has(transaction.tripId))
          .filter((transaction) => user.role !== 'traveler' || transaction.userId === user.id)
          .length;

      return {
          tripCount: visibleTrips.length,
          unreadMessages,
          myBalance,
          onlinePaymentsCount,
      };
  }, [financialRecords, messages, paymentTransactions, user.id, user.role, visibleTrips]);

  const featuredTrip = useMemo(() => {
    return [...visibleTrips].sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime())[0] || null;
  }, [visibleTrips]);

  const routeState = useMemo(
    () =>
      resolveDashboardRoute({
        pathname: location.pathname,
        visibleTrips,
        featuredTrip,
        unreadCounts,
      }),
    [featuredTrip, location.pathname, unreadCounts, visibleTrips]
  );

  const { mainView, selectedTripId, activeTripView } = routeState;

  const tripMessages = useMemo(
    () => messages
      .filter(m => m.tripId === selectedTripId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [messages, selectedTripId]
  );

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return visibleTrips.find(t => t.id === selectedTripId) || null;
  }, [selectedTripId, visibleTrips]);

  const tripFinancialRecords = useMemo(() => {
      if (!selectedTripId) return [];
      return financialRecords.filter(r => r.tripId === selectedTripId);
  }, [selectedTripId, financialRecords]);
  
  const tripDocuments = useMemo(() => {
      if (!selectedTripId) return [];
      return documents.filter(d => d.tripId === selectedTripId);
  }, [selectedTripId, documents]);

  const tripPersonalDataConfigs = useMemo(() => {
      if (!selectedTripId) return [];
      return personalDataConfigs.filter(c => c.tripId === selectedTripId);
  }, [selectedTripId, personalDataConfigs]);

  const tripPersonalDataRecords = useMemo(() => {
      return personalDataRecords;
  }, [personalDataRecords]);
  
  const tripItineraryItems = useMemo(() => {
      if (!selectedTripId) return [];
      return itineraryItems.filter(i => i.tripId === selectedTripId);
  }, [selectedTripId, itineraryItems]);

  useEffect(() => {
    const normalizedPath = normalizePathname(location.pathname);
    if (routeState.canonicalPath && routeState.canonicalPath !== normalizedPath) {
      navigate(routeState.canonicalPath, { replace: true });
    }
  }, [location.pathname, navigate, routeState.canonicalPath]);

  const handleSelectTrip = (tripId: string) => {
    navigate(getTripPath(tripId));
    setMobileSidebarOpen(false);
  };

  const handleSelectView = (view: TripView) => {
    if (!selectedTripId) {
      navigate(DASHBOARD_HOME_PATH);
      setMobileSidebarOpen(false);
      return;
    }

    navigate(getTripPath(selectedTripId, view));
    setMobileSidebarOpen(false);
  };

  const handleShowTrips = () => {
    navigate(getMainViewPath('trips'));
    setMobileSidebarOpen(false);
  }

  const handleShowUsers = () => {
    navigate(getMainViewPath('users'));
    setMobileSidebarOpen(false);
  }

  const handleShowAccount = () => {
    navigate(getMainViewPath('account'));
    setMobileSidebarOpen(false);
  }

  const handleShowSiteSettings = () => {
    navigate(getMainViewPath('site'));
    setMobileSidebarOpen(false);
  }

  const handleShowFiles = () => {
    navigate(getMainViewPath('files'));
    setMobileSidebarOpen(false);
  }

  const handleOpenMobileTrip = () => {
    const targetTrip = selectedTrip || featuredTrip || visibleTrips[0] || null;
    if (!targetTrip) {
      handleShowTrips();
      return;
    }
    navigate(getTripPath(targetTrip.id));
    setMobileSidebarOpen(false);
  };

  const handleOpenMobileMessages = () => {
    const targetTrip = selectedTrip || featuredTrip || visibleTrips.find((trip) => unreadCounts[trip.id] > 0) || visibleTrips[0] || null;
    if (!targetTrip) {
      handleShowTrips();
      return;
    }
    navigate(getTripPath(targetTrip.id, 'messages'));
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    if (mainView === 'users') {
        return <UserManagement onInvite={() => setInviteOpen(true)} trips={trips} users={allUsers} refreshKey={inviteRefresh} onUsersChanged={() => { setUserRefresh(v => v + 1); refreshTrips(); }} currentUserRole={user.role} />;
    }

  if (mainView === 'account') {
      return <AccountSettings user={user} />;
  }

  if (mainView === 'site') {
      return <SiteSettingsView settings={siteSettings} onChange={setSiteSettings} user={user} />;
  }

  if (mainView === 'files') {
      return <AllFilesView documents={documents} users={allUsers} trips={trips} user={user} />;
  }

    if (selectedTrip) {
        switch (activeTripView) {
            case 'summary': return <TripSummary trip={selectedTrip} user={user} users={allUsers} onSelectView={handleSelectView} />;
            case 'financials': return <TripFinancials trip={selectedTrip} user={user} records={tripFinancialRecords} users={allUsers} paymentTransactions={paymentTransactions} onAddRecord={onAddFinancialRecord} onUpdateRecord={onUpdateFinancialRecord} onRemoveRecord={onRemoveFinancialRecord} onStartStripePayment={onStartStripePayment} onStartPaypalPayment={onStartPaypalPayment} />;
            case 'itinerary': return <TripItinerary trip={selectedTrip} user={user} items={tripItineraryItems} onAddItem={onAddItineraryItem} onUpdateItem={onUpdateItineraryItem} onRemoveItem={onRemoveItineraryItem} />;
            case 'documents': return <TripDocuments trip={selectedTrip} user={user} documents={tripDocuments} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} onRemoveDocument={onRemoveDocument} users={allUsers} />;
            case 'messages': return <TripMessages trip={selectedTrip} user={user} users={allUsers} messages={tripMessages} onAddMessage={onAddMessage} onUpdateMessage={onUpdateMessage} onRemoveMessage={onRemoveMessage} onMarkRead={onMarkMessageRead} />;
            case 'personalData': return <TripPersonalData trip={selectedTrip} user={user} configs={tripPersonalDataConfigs} records={tripPersonalDataRecords} onUpdateRecord={onUpdatePersonalData} onToggleLock={onTogglePersonalDataLock} onUpsertConfig={onUpsertPersonalDataConfig} onRemoveConfig={onRemovePersonalDataConfig} users={allUsers} />;
            case 'users':
              if (user.role !== 'admin' && !selectedTrip.organizerIds.includes(String(user.id))) {
                return <p>You do not have access to manage participants for this trip.</p>;
              }
              return <TripUserManagement trip={selectedTrip} users={allUsers} currentUser={user} onChange={() => { refreshTrips(); setUserRefresh(v => v + 1); }} />;
            case 'contact':
              return <TripContactInfo user={user} onSaved={() => setUserRefresh(v => v + 1)} />;
            case 'settings':
              return <TripSettings trip={selectedTrip} user={user} onUpdated={refreshTrips} onDeleted={() => { navigate(DASHBOARD_HOME_PATH); refreshTrips(); }} />;
            default: return <h2>Select a view</h2>;
        }
    }

    return (
        <>
            {paymentFeedback && (
                <div className={`floating-feedback ${paymentFeedback.type}`} role="status">
                    <span>{paymentFeedback.message}</span>
                    <button type="button" onClick={onDismissPaymentFeedback} aria-label="Dismiss notification">×</button>
                </div>
            )}
            <section className="dashboard-overview-hero dashboard-overview-v2">
                <div className="dashboard-overview-copy dashboard-overview-copy-v2">
                    <span className="section-eyebrow">Travel operations board</span>
                    <h2>Trips, travelers, and payments in one calm, premium workspace</h2>
                    <p>
                        Start with the signals that matter most each day: active trips, unread updates, incoming payments, and the next operational focus.
                    </p>
                    <div className="dashboard-overview-actions">
                        {user.role === 'admin' && (
                            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                                Create trip
                            </button>
                        )}
                        {(user.role === 'admin' || user.role === 'organizer') && (
                            <button onClick={() => setInviteOpen(true)} className="btn btn-secondary">
                                Send invite
                            </button>
                        )}
                    </div>
                </div>
                <div className="dashboard-overview-rail dashboard-overview-rail-v2">
                    <div className="dashboard-overview-stats dashboard-overview-stats-v2">
                        <div className="overview-stat-card overview-stat-card-v2">
                            <span>Active trips</span>
                            <strong>{overviewMetrics.tripCount}</strong>
                        </div>
                        <div className="overview-stat-card overview-stat-card-v2">
                            <span>Unread messages</span>
                            <strong>{overviewMetrics.unreadMessages}</strong>
                        </div>
                        <div className="overview-stat-card overview-stat-card-v2">
                            <span>Online payments</span>
                            <strong>{overviewMetrics.onlinePaymentsCount}</strong>
                        </div>
                        <div className="overview-stat-card overview-stat-card-v2">
                            <span>Balance</span>
                            <strong>{overviewMetrics.myBalance.toLocaleString()} HUF</strong>
                        </div>
                    </div>
                    <div className="dashboard-overview-note dashboard-overview-note-v2">
                        <span className="dashboard-overview-note-label">Featured trip</span>
                        <strong>{featuredTrip ? featuredTrip.name : 'No trip highlighted yet'}</strong>
                        <p>
                            {featuredTrip
                                ? `${formatDisplayDate(featuredTrip.startDate)} - ${formatDisplayDate(featuredTrip.endDate)} · ${getTripStageMeta(featuredTrip).summary}`
                                : 'Your next active or upcoming trip will surface here automatically.'}
                        </p>
                    </div>
                </div>
            </section>
            <div className="dashboard-header dashboard-header-v2">
                <div>
                    <h2>Active trips</h2>
                    <p className="dashboard-header-intro">Open a trip to move between itinerary, documents, finance, traveler data, and communications without losing context.</p>
                </div>
            </div>
            <div className="trip-list trip-list-v2">
                {visibleTrips.length > 0 ? (
                visibleTrips.map((trip: Trip) => (
                    <React.Fragment key={trip.id}>
                        <TripCard
                            trip={trip}
                            tripPath={getTripPath(trip.id)}
                        />
                    </React.Fragment>
                ))
                ) : (
                <p className="no-trips">No trips are available for this account yet.</p>
                )}
            </div>
        </>
    );
  };

  return (
     <div className={`dashboard-layout dashboard-layout-v2 with-sidebar ${isMobileSidebarOpen ? 'sidebar-is-open' : ''}`}>
        <Sidebar
            trips={visibleTrips}
            selectedTripId={selectedTripId}
            activeView={activeTripView}
            mainView={mainView}
            userRole={user.role}
            userId={String(user.id)}
            isOpen={isMobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            onNavigate={() => setMobileSidebarOpen(false)}
            onLogout={onLogout}
            unreadCounts={unreadCounts}
            theme={theme}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            logos={siteSettings}
        />
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
        <div className="dashboard-container dashboard-container-v2">
          <Header
            user={user}
            onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
            showHamburger={isTabletOrBelow}
          />
          {isMobile && selectedTrip && (
            <TripSubnav
              trip={selectedTrip}
              user={user}
              activeView={activeTripView}
              unreadCount={unreadCounts[selectedTrip.id] || 0}
              onSelectView={handleSelectView}
            />
          )}
          <main className="dashboard-content dashboard-content-v2">
            {renderContent()}
          </main>
          {user.role === 'admin' && (
            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                currentUser={user}
                onCreated={onCreateTrip}
            />
          )}
          {(user.role === 'admin' || user.role === 'organizer') && (
            <InviteUserModal
                isOpen={isInviteOpen}
                onClose={() => setInviteOpen(false)}
                trips={trips}
                onSent={() => setInviteRefresh(v => v + 1)}
                currentUser={user}
            />
          )}
        </div>
    </div>
  );
};



export default Dashboard;
