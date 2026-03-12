import React, { useState, useEffect, useMemo, useRef } from "react";
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
    organizer: 'Szervező',
    traveler: 'Utas',
};

const formatDisplayDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('hu-HU', {
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
            label: 'Lezárt út',
            className: 'is-complete',
            summary: 'Az út már lezárult, a dokumentáció és az elszámolás marad hátra.',
        };
    }

    if (start > today) {
        return {
            label: 'Előkészítés alatt',
            className: 'is-upcoming',
            summary: 'Most a dokumentumok, befizetések és utasadatok összerendezése a fókusz.',
        };
    }

    return {
        label: 'Aktív szervezés',
        className: 'is-live',
        summary: 'Az út élő állapotban van, minden fontos információ itt frissül.',
    };
};

const ThemeSwitcher = ({ theme, onThemeChange }: { theme: Theme, onThemeChange: (theme: Theme) => void }) => (
    <div className="theme-switcher">
        <button className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')} aria-label="Világos téma">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')} aria-label="Sötét téma">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <button className={theme === 'auto' ? 'active' : ''} onClick={() => onThemeChange('auto')} aria-label="Rendszerbeállítás">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </button>
    </div>
);

const Header = ({ user, onToggleSidebar, showHamburger }: {
    user: User;
    onToggleSidebar: () => void;
    showHamburger: boolean;
}) => (
  <header className="app-header">
    <div className="header-left">
         {showHamburger && (
            <button className="hamburger-menu" onClick={onToggleSidebar} aria-label="Menü megnyitása">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
         )}
         <div className="brand-lockup">
            <span className="brand-kicker">Travel operations</span>
            <h1 className="logo">myTrip</h1>
         </div>
    </div>
    <div className="user-info">
      <div className="user-badge">
        <span className="user-badge-label">Bejelentkezve</span>
        <strong>{user.name}</strong>
        <span className="user-badge-meta">{ROLE_LABELS[user.role]}</span>
      </div>
    </div>
  </header>
);

const CreateTripModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE}/api/users`)
        .then(res => res.json())
        .then(users => setOrganizers(users.filter((u: any) => u.role === 'organizer')));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !organizerId) {
      alert('Kérjük, töltsön ki minden mezőt.');
      return;
    }
    const tripRes = await fetch(`${API_BASE}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, organizerIds: [organizerId], travelerIds: [] })
    });
    const trip = await tripRes.json();
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
    onClose();
    setName(''); setStartDate(''); setEndDate(''); setOrganizerId('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Új utazás létrehozása</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tripName">Utazás neve</label>
            <input id="tripName" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Kezdés dátuma</label>
            <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Befejezés dátuma</label>
            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="organizer">Szervező</label>
            <select id="organizer" value={organizerId} onChange={e => setOrganizerId(e.target.value)} required>
              <option value="">Válasszon szervezőt</option>
              {organizers.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
            <button type="submit" className="btn btn-primary">Létrehozás</button>
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
    if (!window.confirm('Biztosan visszavonja a meghívót?')) return;
    await fetch(`${API_BASE}/api/invitations/${id}`, { method: 'DELETE' });
    loadInvites();
  };

  return (
    <div className="trip-user-management">
      <h2>Utasok: {trip.name}</h2>
      <div className="trip-users-section">
        <h3>Szervezők</h3>
        <ul>
          {organizers.map(o => (
            <li key={o.id}>
              {o.name}
              {canManageOrganizers && o.id !== currentUser.id && organizers.length > 1 && (
                <button className="btn btn-danger btn-small" onClick={() => removeOrganizer(o.id)}>Eltávolítás</button>
              )}
            </li>
          ))}
        </ul>
        {canManageOrganizers && (
          <div className="assign-row">
            <select value={newOrganizer} onChange={e => setNewOrganizer(e.target.value)}>
              <option value="">Szervező hozzáadása</option>
              {availableOrganizers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button className="btn btn-secondary btn-small" onClick={addOrganizer}>Hozzáadás</button>
          </div>
        )}
      </div>
      <div className="trip-users-section">
        <h3>Utazók</h3>
        <ul>
          {travelers.map(t => (
            <li key={t.id}>
              {t.name}
              {canManageTravelers && (
                <button className="btn btn-danger btn-small" onClick={() => removeTraveler(t.id)}>Eltávolítás</button>
              )}
            </li>
          ))}
        </ul>
        {canManageTravelers && (
          <>
            <div className="assign-row">
              <select value={newTraveler} onChange={e => setNewTraveler(e.target.value)}>
                <option value="">Utazó hozzáadása</option>
                {availableTravelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="btn btn-secondary btn-small" onClick={addTraveler}>Hozzáadás</button>
            </div>
            <div className="assign-row">
              <button className="btn btn-secondary btn-small" onClick={() => setInviteOpen(true)}>Meghívó küldése</button>
            </div>
            {invites.length > 0 && (
              <table className="user-table">
                <thead>
                  <tr><th>Név</th><th>E-mail</th><th>Lejárat</th><th>Állapot</th><th></th></tr>
                </thead>
                <tbody>
                  {invites.map(inv => (
                    <tr key={inv._id}>
                      <td>{inv.firstName} {inv.lastName}</td>
                      <td>{inv.email}</td>
                      <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                      <td>{inv.used ? 'Regisztrált' : 'Várakozik'}</td>
                      <td className="invite-actions">
                        {!inv.used && (
                          <>
                            <button className="btn btn-secondary btn-small" onClick={() => resendInvite(inv._id)}>Újraküldés</button>
                            <button className="btn btn-danger btn-small" onClick={() => revokeInvite(inv._id)}>Visszavonás</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    return <p>Nincs jogosultsága a beállításokhoz.</p>;
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
    if (!window.confirm('Biztosan törli az utazást?')) return;
    if (!window.confirm('A művelet nem vonható vissza. Folytatja?')) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}`, { method: 'DELETE' });
    onDeleted();
  };

  return (
    <div className="trip-settings">
      <h2>Beállítások: {name}</h2>
      <div className="form-group">
        <label htmlFor="tripName">Utazás neve</label>
        <input id="tripName" type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="startDate">Kezdés dátuma</label>
        <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="endDate">Befejezés dátuma</label>
        <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave}>Mentés</button>
        <button className="btn btn-danger" onClick={handleDelete}>Utazás törlése</button>
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
      setStatusMessage('Nincs jogosultság a mentéshez.');
      return;
    }
    clearStatusTimer();
    setStatus('saving');
    setStatusMessage('Mentés folyamatban…');
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
      setStatusMessage('Kapcsolattartó adatai mentve.');
      onSaved();
      statusTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
        statusTimerRef.current = null;
      }, 4000);
    } catch (err) {
      setStatus('error');
      setStatusMessage('Nem sikerült menteni. Kérjük, próbálja meg újra.');
    }
  };

  return (
    <div className="contact-info-form">
      <h2>Kapcsolattartó adatai</h2>
      <div className="form-group">
        <label htmlFor="contactTitle">Titulus / megnevezés</label>
        <input
          id="contactTitle"
          type="text"
          value={contactTitle}
          onChange={e => setContactTitle(e.target.value)}
          placeholder="Pl. Főszervező"
        />
      </div>
      <div className="form-group">
        <label htmlFor="contactPhone">Telefonszám</label>
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
          <span>Megjelenjen a vészhelyzeti kapcsolattartók között</span>
        </label>
        <p className="form-hint">Az Összegzés oldalon látható vészhelyzeti blokkban jelenik meg.</p>
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saving' ? 'Mentés folyamatban…' : 'Mentés'}
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

  const isOrganizer = currentUser.role === 'organizer';
  const availableTrips = isOrganizer ? trips.filter(t => t.organizerIds.includes(currentUser.id)) : trips;

  const loadInvites = () => {
    fetch(`${API_BASE}/api/invitations`).then(res => res.json()).then(setInvites);
  };

  useEffect(() => {
    if (isOpen) {
      loadInvites();
      if (isOrganizer) {
        setRole('traveler');
      }
      if (fixedTripId) {
        setTripId(fixedTripId);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, role: isOrganizer ? 'traveler' : role, tripId: tripId || undefined })
    });
    if (res.status === 409) {
      alert('Ehhez az e-mailhez már van meghívó. Küldje újra a Felhasználók oldalon.');
      return;
    }
    if (!res.ok) {
      alert('Hiba történt a meghívó küldésekor.');
      return;
    }
    alert('Meghívó elküldve');
    onSent();
    loadInvites();
    onClose();
    setFirstName('');
    setLastName('');
    setEmail('');
    setTripId(fixedTripId || '');
    setRole('traveler');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Meghívó küldése</h2>
        <p className="modal-note">Kérjük, a nevet csak angol (ékezet nélküli) betűkkel add meg.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inviteFirstName">Keresztnév</label>
            <input id="inviteFirstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="inviteLastName">Vezetéknév</label>
            <input id="inviteLastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="inviteEmail">E-mail</label>
            <input id="inviteEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {!isOrganizer && (
            <div className="form-group">
              <label htmlFor="inviteRole">Szerep</label>
              <select id="inviteRole" value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="organizer">Szervező</option>
                <option value="traveler">Utazó</option>
              </select>
            </div>
          )}
          {!fixedTripId && (
            <div className="form-group">
              <label htmlFor="inviteTrip">Utazás{isOrganizer ? '' : ' (opcionális)'}</label>
              <select id="inviteTrip" value={tripId} onChange={e => setTripId(e.target.value)} required={isOrganizer}>
                {!isOrganizer && <option value="">Nincs</option>}
                {availableTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
            <button type="submit" className="btn btn-primary">Meghívás</button>
          </div>
        </form>
        {invites.length > 0 && (
          <div className="pending-invites">
            <h3>Függő meghívók</h3>
            <table className="user-table">
              <thead>
                <tr><th>Név</th><th>E-mail</th><th>Szerep</th><th>Utazás</th><th>Lejárat</th></tr>
              </thead>
              <tbody>
                {invites.map((inv: any) => (
                  <tr key={inv._id}>
                    <td>{inv.firstName} {inv.lastName}</td>
                    <td>{inv.email}</td>
                    <td>{inv.role}</td>
                    <td>{availableTrips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                    <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    if (!window.confirm('Biztosan törli a meghívót?')) return;
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
    if (!window.confirm('Biztosan szervezővé teszi ezt a felhasználót?')) return;
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
    if (!window.confirm('Biztosan törli a felhasználót?')) return;
    await fetch(`${API_BASE}/api/users/${selectedUser._id}`, { method: 'DELETE' });
    setSelectedUser(null);
    onUsersChanged();
  };

  return (
    <div className="user-management">
      <div className="dashboard-header">
        <h2>Felhasználók</h2>
        <button onClick={onInvite} className="btn btn-secondary">Meghívó küldése</button>
      </div>

      <h3>Szervezők ({organizers.length})</h3>
      {organizers.length > 0 ? (
        <div className="user-tiles">
          {organizers.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile organizer${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">Szervező</div>
            </div>
          ))}
        </div>
      ) : <p>Nincsenek szervezők.</p>}

      <h3>Egyéb felhasználók ({others.length})</h3>
      {others.length > 0 ? (
        <div className="user-tiles">
          {others.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile ${u.role}${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">{u.role}</div>
            </div>
          ))}
        </div>
      ) : <p className="no-users">Nincsenek felhasználók.</p>}

      {selectedUser && (
        <div className="user-detail">
          <h3>{selectedUser.name}</h3>
          {currentUserRole === 'admin' && selectedUser.role === 'traveler' && (
            <button className="btn btn-primary" onClick={handlePromoteToOrganizer}>
              Szervezővé léptetés
            </button>
          )}
          {userTrips.length > 0 ? (
            <ul>
              {userTrips.map(t => (
                <li key={t.id}>{t.name} <button className="btn btn-danger btn-small" onClick={() => handleRemoveFromTrip(t.id)}>Eltávolítás</button></li>
              ))}
            </ul>
          ) : <p>Nincs hozzárendelve utazáshoz.</p>}
          {selectedUser.role === 'organizer' && (
            <div className="assign-trip">
              <select value={assignTripId} onChange={e => setAssignTripId(e.target.value)}>
                <option value="">Utazás hozzárendelése</option>
                {trips.filter(t => !t.organizerIds.includes(selectedUser._id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-small" onClick={handleAssignOrganizer}>Hozzárendelés</button>
            </div>
          )}
          <button className="btn btn-danger" onClick={handleDeleteUser}>Felhasználó törlése</button>
        </div>
      )}

      {invites.length > 0 && (
        <div className="pending-invites">
          <h3>Függő meghívók</h3>
          <table className="user-table">
            <thead>
              <tr><th>Név</th><th>E-mail</th><th>Szerep</th><th>Utazás</th><th>Lejárat</th><th>Műveletek</th></tr>
            </thead>
            <tbody>
              {invites.map((inv: any) => (
                <tr key={inv._id}>
                  <td>{inv.firstName} {inv.lastName}</td>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{trips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                  <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td>
                    <div className="invite-actions">
                      <button className="btn btn-secondary btn-small" onClick={() => handleResend(inv._id)}>Újraküldés</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteInvite(inv._id)}>Törlés</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip, onSelectTrip }: { trip: Trip; onSelectTrip: () => void; }) => {
    const stage = getTripStageMeta(trip);
    const durationDays = getTripDurationDays(trip);

    return (
        <article className="trip-card">
            <div className="trip-card-shell">
                <div className="trip-card-topline">
                    <span className={`trip-stage-badge ${stage.className}`}>{stage.label}</span>
                    <span className="trip-card-range">{formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}</span>
                </div>
                <h3>{trip.name}</h3>
                <p className="trip-card-summary">{stage.summary}</p>
                <div className="trip-card-metrics">
                    <div className="trip-card-metric">
                        <span>Időtartam</span>
                        <strong>{durationDays} nap</strong>
                    </div>
                    <div className="trip-card-metric">
                        <span>Szervezők</span>
                        <strong>{trip.organizerNames?.length || 0}</strong>
                    </div>
                    <div className="trip-card-metric">
                        <span>Résztvevők</span>
                        <strong>{trip.travelerIds.length}</strong>
                    </div>
                </div>
                <div className="trip-card-foot">
                    <span>Lead szervezők</span>
                    <strong>{trip.organizerNames?.join(', ') || 'Nincs megadva'}</strong>
                </div>
            </div>
            <div className="trip-card-actions">
                <button onClick={onSelectTrip} className="btn btn-primary">
                   Megnyitás
                </button>
            </div>
        </article>
    );
};

// --- TRIP CONTENT COMPONENTS ---

const TripSummary = ({ trip, user, users, onSelectView }: { trip: Trip; user: User; users: User[]; onSelectView: (view: TripView) => void; }) => {
    const [countdown, setCountdown] = useState("0 nap");
    useEffect(() => {
        const updateCountdown = () => {
            const start = new Date(trip.startDate);
            const now = new Date();
            const diff = start.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown("Már úton vagy!");
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                setCountdown(`${days} nap ${hours} óra ${minutes} perc`);
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
        ? 'Nézd át a dokumentumaidat, a saját befizetéseidet és az új üzeneteket.'
        : 'Kövesd a befizetéseket, az utasadatokat és a nyitott dokumentumhiányokat.';

    const tiles: { key: TripView; label: string; hint: string; className: string }[] = [
        { key: 'itinerary', label: 'Útiterv', hint: 'programok és mozgások', className: 'tile-itinerary' },
        { key: 'documents', label: 'Dokumentumok', hint: 'jegyek, pdf-ek, fájlok', className: 'tile-documents' },
        { key: 'messages', label: 'Üzenetek', hint: 'kommunikáció és frissítések', className: 'tile-messages' },
        { key: 'financials', label: 'Pénzügyek', hint: 'egyenleg és befizetések', className: 'tile-financials' },
        { key: 'personalData', label: 'Személyes adatok', hint: 'útlevél és profiladatok', className: 'tile-personal' },
    ];
    if (user.role === 'admin' || (user.role === 'organizer' && trip.organizerIds.includes(String(user.id)))) {
        tiles.push({ key: 'users', label: 'Utasok', hint: 'résztvevők és szerepkörök', className: 'tile-users' });
        tiles.push({ key: 'settings', label: 'Beállítások', hint: 'trip konfiguráció', className: 'tile-settings' });
    }

    return (
        <div className="trip-summary">
            <div className="trip-summary-hero">
                <div className="trip-summary-copy">
                    <div className="trip-summary-headline-row">
                        <span className="trip-summary-eyebrow">Trip cockpit</span>
                        <span className={`trip-stage-badge ${stage.className}`}>{stage.label}</span>
                    </div>
                    <h2 className="trip-title">{trip.name}</h2>
                    <p className="trip-summary-subtitle">
                        Egyetlen munkafelületen látod az út állapotát, a fontos fájlokat, az üzeneteket és a pénzügyi mozgásokat.
                    </p>
                    <div className="trip-summary-route">
                        <div>
                            <span>Időszak</span>
                            <strong>{formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}</strong>
                        </div>
                        <div>
                            <span>Következő fókusz</span>
                            <strong>{stage.summary}</strong>
                        </div>
                    </div>
                </div>
                <div className="trip-summary-metrics">
                    <div className="trip-metric-card">
                        <span className="trip-metric-label">Indulasig</span>
                        <strong>{countdown}</strong>
                    </div>
                    <div className="trip-metric-card">
                        <span className="trip-metric-label">Idotartam</span>
                        <strong>{durationDays} nap</strong>
                    </div>
                    <div className="trip-metric-card">
                        <span className="trip-metric-label">Utasok</span>
                        <strong>{trip.travelerIds.length}</strong>
                    </div>
                </div>
            </div>
            <div className="summary-tiles summary-tiles-refresh">
                {tiles.map(t => (
                    <button
                        key={t.key}
                        className={`summary-tile ${t.className}`}
                        onClick={() => onSelectView(t.key)}
                    >
                        <span>{t.label}</span>
                        <small>{t.hint}</small>
                    </button>
                ))}
            </div>
            <div className="trip-summary-side-grid">
                <div className="trip-summary-panel">
                    <h3>Utazási áttekintés</h3>
                    <div className="trip-summary-facts">
                        <div>
                            <span>Kezdés</span>
                            <strong>{formatDisplayDate(trip.startDate)}</strong>
                        </div>
                        <div>
                            <span>Befejezés</span>
                            <strong>{formatDisplayDate(trip.endDate)}</strong>
                        </div>
                        <div>
                            <span>Szervezők</span>
                            <strong>{trip.organizerNames?.join(', ') || 'Nincs megadva'}</strong>
                        </div>
                    </div>
                    <div className="trip-summary-callout">
                        <span>{user.role === 'traveler' ? 'Ajánlott következő lépés' : 'Működési fókusz'}</span>
                        <strong>{summaryFocus}</strong>
                    </div>
                </div>
                <div className="emergency-contacts trip-summary-panel">
                <h3>Vészhelyzeti kapcsolattartó{emergencyContacts.length === 1 ? '' : 'k'}</h3>
                {emergencyContacts.length > 0 ? (
                    emergencyContacts.map((o, index) => {
                        const displayName = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.name || 'Ismeretlen kapcsolattartó';
                        const key = o.id || o.contactEmail || o.contactPhone || `contact-${index}`;
                        return (
                            <div key={key} className="contact-card">
                                <div className="contact-name">{displayName}</div>
                                {o.contactTitle && <div className="contact-title">{o.contactTitle}</div>}
                                {o.contactPhone && <div className="contact-phone">📞 {o.contactPhone}</div>}
                                {o.contactEmail && <div className="contact-email">✉️ {o.contactEmail}</div>}
                            </div>
                        );
                    })
                ) : (
                    <p className="contact-empty">Jelenleg nincs megadott vészhelyzeti kapcsolattartó.</p>
                )}
                </div>
            </div>
        </div>
    );
};

const PaymentStatusBadge = ({ status }: { status: PaymentTransaction['status'] }) => (
    <span className={`payment-status-badge status-${status}`}>{status === 'completed' ? 'Jovairva' : status === 'failed' ? 'Sikertelen' : 'Folyamatban'}</span>
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
            alert('Adj meg ervenyes befizetesi osszeget.');
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
            alert(error?.message || 'Nem sikerult elinditani a fizetest.');
            setIsSubmitting(false);
        }
    };

    return (
        <section className="online-payment-panel">
            <div className="online-payment-copy">
                <span className="online-payment-eyebrow">Online befizetes</span>
                <h3>Gyors, automatikus jovairas</h3>
                <p>
                    Stripe vagy PayPal fizetes utan a rendszer automatikusan uj penzugyi tetelt hoz letre a sajat nevedre.
                </p>
                <div className="online-payment-highlights">
                    <div>
                        <strong>Automatikus könyvelés</strong>
                        <span>A jóváírás közvetlenül bekerül a trip pénzügyei közé.</span>
                    </div>
                    <div>
                        <strong>Biztonságos checkout</strong>
                        <span>A fizetés a Stripe vagy a PayPal saját felületén fejeződik be.</span>
                    </div>
                </div>
            </div>
            <form className="online-payment-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="online-payment-amount">Osszeg</label>
                    <input
                        id="online-payment-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="pl. 120000"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="online-payment-description">Leiras</label>
                    <input
                        id="online-payment-description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="provider-toggle" role="tablist" aria-label="Fizetesi szolgaltato">
                    <button type="button" className={provider === 'stripe' ? 'active' : ''} onClick={() => setProvider('stripe')}>Stripe</button>
                    <button type="button" className={provider === 'paypal' ? 'active' : ''} onClick={() => setProvider('paypal')}>PayPal</button>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Atiranyitas...' : `${provider === 'stripe' ? 'Stripe' : 'PayPal'} fizetes inditasa`}
                </button>
                <p className="online-payment-note">A sikeres fizetés után a befizetés automatikusan jóváíródik ennél az útnál.</p>
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
            alert("Kérjük, töltsön ki minden mezőt helyesen.");
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
            alert(error?.message || 'Nem sikerült hozzáadni a tételt.');
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
            alert('Kérjük, töltsön ki minden mezőt helyesen.');
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
            alert(error?.message || 'Nem sikerült frissíteni a tételt.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!window.confirm('Biztosan törli ezt a tételt?')) {
            return;
        }
        try {
            await Promise.resolve(onRemoveRecord(recordId));
            if (editingId === recordId) {
                setEditingId(null);
            }
        } catch (error: any) {
            alert(error?.message || 'Nem sikerült törölni a tételt.');
        }
    };

    return (
        <div className="financials-page">
            <div className="financials-hero">
                <div>
                    <span className="section-eyebrow">Finance desk</span>
                    <h2>Penzugyek: {trip.name}</h2>
                    <p className="section-intro">Kovetheted a manuális tételeket, az online befizeteseket es a resztvevok egyenlegét egy helyen.</p>
                </div>
                <div className="financials-hero-cards">
                    <div className="summary-card compact">
                        <h4>Osszes tranzakcio</h4>
                        <p className="balance">{records.length}</p>
                    </div>
                    <div className="summary-card compact">
                        <h4>Online fizetesek</h4>
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
                    <h3>Egyenlegek</h3>
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

                    <h3>Új tétel hozzáadása</h3>
                    <form className="add-record-form" onSubmit={handleAddRecord}>
                        <div className="form-row">
                             <div className="form-group">
                                <label htmlFor="participant">Résztvevő</label>
                                <select id="participant" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                                    {tripParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Leírás</label>
                                <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="amount">Összeg (HUF)</label>
                                <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Típus</label>
                                <div className="radio-group">
                                    <label><input type="radio" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} /> Kiadás</label>
                                    <label><input type="radio" value="payment" checked={type === 'payment'} onChange={() => setType('payment')} /> Befizetés</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isAdding}>
                            {isAdding ? 'Mentés...' : 'Hozzáadás'}
                        </button>
                    </form>
                </>
            )}

            {tripPaymentTransactions.length > 0 && (
                <>
                    <h3>Online fizetesek</h3>
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
                                        <p>{payer?.name || 'Ismeretlen felhasznalo'}</p>
                                    </div>
                                    <div className="payment-activity-meta">
                                        <strong>{transaction.amount.toLocaleString()} {transaction.currency}</strong>
                                        <span>{transaction.completedAt ? new Date(transaction.completedAt).toLocaleString('hu-HU') : 'Feldolgozas alatt'}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            <h3>Tranzakciók</h3>
            <div className="table-container">
                <table className="financial-table">
                    <thead>
                        <tr>
                            {isStaff && <th>Résztvevő</th>}
                            <th>Dátum</th>
                            <th>Leírás</th>
                            <th>Összeg (HUF)</th>
                            {isStaff && <th>Műveletek</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {records
                            .filter(r => user.role !== 'traveler' || r.userId === user.id)
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(r => {
                                const participant = users.find(u => u.id === r.userId);
                                const isEditing = editingId === r.id;
                                return (
                                    <tr key={r.id}>
                                        {isStaff && (
                                            <td>
                                                {isEditing ? (
                                                    <select value={editUserId} onChange={e => setEditUserId(e.target.value)}>
                                                        {editUserId && !tripParticipants.find(p => p.id === editUserId) && (
                                                            <option value={editUserId}>Ismeretlen résztvevő</option>
                                                        )}
                                                        {tripParticipants.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    participant?.name || 'Ismeretlen'
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
                                                            Kiadás
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name={`edit-type-${r.id}`}
                                                                value="payment"
                                                                checked={editType === 'payment'}
                                                                onChange={() => setEditType('payment')}
                                                            />
                                                            Befizetés
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
                                                                Mentés
                                                            </button>
                                                            <button type="button" className="icon-button cancel" onClick={handleCancelEdit} disabled={isSavingEdit}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                Mégse
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button type="button" className="icon-button" onClick={() => startEditRecord(r)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                                Szerkesztés
                                                            </button>
                                                            <button type="button" className="icon-button danger" onClick={() => handleDeleteRecord(r.id)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                                                                Törlés
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

            {user.role === 'traveler' && (
                 <div className="financial-summary traveler-summary">
                    <div className="summary-card">
                        <h4>Az Ön egyenlege</h4>
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
            alert('Kérjük, töltse ki a csillaggal jelölt mezőket.');
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
                        <h2>{isAdding ? 'Új programpont hozzáadása' : 'Programpont szerkesztése'}</h2>
                        <div className="form-group">
                            <label htmlFor="itemTitle">Cím *</label>
                            <input id="itemTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDate">Dátum *</label>
                            <input id="itemDate" type="date" value={date} onChange={e => setDate(e.target.value)} required min={tripStartDate} max={tripEndDate} />
                        </div>
                        <div className="time-inputs">
                             <div className="form-group">
                                <label htmlFor="itemStartTime">Kezdés *</label>
                                <input id="itemStartTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="itemEndTime">Befejezés (opcionális)</label>
                                <input id="itemEndTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemTimeZone">Időzóna *</label>
                            <input id="itemTimeZone" type="text" value={timeZone} onChange={e => setTimeZone(e.target.value)} required placeholder="pl. Europe/Paris" />
                            <small>Kérjük, IANA formátumot használjon.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemProgramType">Program típusa</label>
                            <select id="itemProgramType" value={programType} onChange={(e) => setProgramType(e.target.value as 'required' | 'free' | 'optional')}>
                                <option value="required">Kötelező (piros, 50% átlátszóság)</option>
                                <option value="free">Szabad program (zöld, 50% átlátszóság)</option>
                                <option value="optional">Fakultatív program (sárga, 50% átlátszóság)</option>
                            </select>
                            <small>Az időbélyegek színkódjai jelzik a részvétel típusát.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemLocation">Helyszín</label>
                            <input id="itemLocation" type="text" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDescription">Leírás</label>
                            <textarea id="itemDescription" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => { isAdding ? onClose() : (resetForm(), setIsEditing(false)); }} className="btn btn-secondary">Mégse</button>
                            <button type="submit" className="btn btn-primary">{isAdding ? 'Hozzáadás' : 'Mentés'}</button>
                        </div>
                    </form>
                ) : currentItem ? (
                     <div>
                        <div className="modal-header">
                            <h2>{currentItem.title}</h2>
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>{new Date(currentItem.startDateTimeLocal).toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                            <p>
                                <strong>{formatTime(currentItem.startDateTimeLocal)}{currentItem.endDateTimeLocal ? ` - ${formatTime(currentItem.endDateTimeLocal)}` : ''}</strong> ({currentItem.timeZone})
                            </p>
                             {currentItem.location && <p><strong>Helyszín:</strong> {currentItem.location}</p>}
                        </div>
                        <div className="modal-body">
                           <p>{currentItem.description || 'Nincs leírás megadva.'}</p>
                        </div>
                        <div className="modal-actions">
                            {canEditExisting && <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>Szerkesztés</button>}
                            <button type="button" onClick={onClose} className="btn btn-primary">Bezárás</button>
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
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
    const [startEditMode, setStartEditMode] = useState(false);
    const closeSelectedItem = () => {
        setSelectedItem(null);
        setStartEditMode(false);
    };

    const isOrganizer = user.role === 'admin' || user.role === 'organizer';

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
                return 'Szabad program';
            case 'optional':
                return 'Fakultatív program';
            default:
                return 'Kötelező';
        }
    };

    const programTypeClass = (type?: ItineraryItem['programType']) => `program-type-${type || 'required'}`;

    return (
        <div>
            <div className="itinerary-header">
                 <h2>Útiterv: {trip.name}</h2>
                 <div className="itinerary-controls">
                    <div className="itinerary-view-switcher">
                        <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Naptár</button>
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>Lista</button>
                    </div>
                    <div className="itinerary-legend" aria-label="Program típus színkódok">
                        <span className="legend-pill program-type-required">Kötelező</span>
                        <span className="legend-pill program-type-free">Szabad program</span>
                        <span className="legend-pill program-type-optional">Fakultatív program</span>
                    </div>
                 </div>
                 {isOrganizer && (
                    <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Új programpont
                    </button>
                )}
            </div>

            {items.length === 0 && (
                <div className="no-itinerary-items">
                    <p>Még nincsenek programpontok hozzáadva ehhez az utazáshoz.</p>
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
                                    {day.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                                    <span className="day-of-week">{day.toLocaleDateString('hu-HU', { weekday: 'long' })}</span>
                                </h3>
                                {dayItems.map(item => (
                                    <div key={item.id} className="itinerary-item-card" onClick={() => { setSelectedItem(item); setStartEditMode(false); }}>
                                        {isOrganizer && (
                                            <button
                                                className="delete-item-btn"
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                                                aria-label="Törlés"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        )}
                                        {isOrganizer && (
                                            <button
                                                className="edit-item-btn"
                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setStartEditMode(true); }}
                                                aria-label="Szerkesztés"
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
                            <h3>{new Date(date + 'T00:00:00').toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
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
                                        <button className="btn btn-secondary" onClick={() => { setSelectedItem(item); setStartEditMode(false); }}>Részletek</button>
                                        {isOrganizer && (
                                            <>
                                                <button className="btn btn-secondary" onClick={() => { setSelectedItem(item); setStartEditMode(true); }}>Szerkesztés</button>
                                                <button
                                                    className="delete-item-btn"
                                                    onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                                                    aria-label="Törlés"
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
        const newCat = prompt('Új kategória neve');
        if (newCat) onAddCategory(newCat);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !file) {
            alert('Kérjük, adjon nevet, kategóriát és válasszon fájlt.');
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
                <h2>Új dokumentum feltöltése</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="docName">Dokumentum neve</label>
                        <input id="docName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="docCategory">Kategória</label>
                        <div className="category-select">
                            <select id="docCategory" value={category} onChange={e => setCategory(e.target.value)} required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCategoryClick} className="btn btn-secondary btn-small">+</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="docVisibleTo">Láthatóság</label>
                        <select id="docVisibleTo" multiple value={selectedUserIds} onChange={handleUserSelect} className="multi-select">
                            <option value="all">Mindenki</option>
                            {tripParticipants.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                        <small>Több felhasználó kijelöléséhez tartsa lenyomva a Ctrl/Cmd billentyűt.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="docFile">Fájl kiválasztása</label>
                        <input id="docFile" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isUploading}>Mégse</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Feltöltés…' : 'Feltöltés'}</button>
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
        const newCat = prompt('Új kategória neve');
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
                <h2>Dokumentum szerkesztése</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="editDocName">Dokumentum neve</label>
                        <input id="editDocName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocCategory">Kategória</label>
                        <div className="category-select">
                            <select id="editDocCategory" value={category} onChange={e => setCategory(e.target.value)} required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCategoryClick} className="btn btn-secondary btn-small">+</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocVisibleTo">Láthatóság</label>
                        <select id="editDocVisibleTo" multiple value={selectedUserIds} onChange={handleUserSelect} className="multi-select">
                            <option value="all">Mindenki</option>
                            {tripParticipants.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                        <small>Több felhasználó kijelöléséhez tartsa lenyomva a Ctrl/Cmd billentyűt.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDocFile">Fájl cseréje</label>
                        <input id="editDocFile" type="file" onChange={handleFileChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isUploading}>Mégse</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Mentés…' : 'Mentés'}</button>
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
        if (window.confirm('Biztosan törli a dokumentumot?')) {
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
                <h2>Dokumentumok: {trip.name}</h2>
                {Object.keys(docsByCategory).length > 0 ? (
                    Object.entries(docsByCategory).map(([category, docs]) => (
                        <div key={category} className="document-category-group">
                            <h3>{category}</h3>
                            <ul className="document-list">
                                {docs.map(doc => (
                                    <li key={doc.id} className="document-item">
                                        <span>{doc.name}</span>
                                        <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} download className="btn btn-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            Letöltés
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>Nincsenek megosztott dokumentumok.</p>
                )}
            </div>
        )
    }

    // Admin & Organizer View
    return (
        <div>
            <div className="dashboard-header">
                <h2>Dokumentumok: {trip.name}</h2>
                <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Új dokumentum feltöltése
                </button>
            </div>
             <div className="table-container">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')}>Név</th>
                            <th onClick={() => requestSort('category')}>Kategória</th>
                            <th onClick={() => requestSort('uploadDate')}>Feltöltés dátuma</th>
                            <th>Láthatóság</th>
                            <th>Műveletek</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDocuments.map(doc => {
                            let visibleToText: string;
                            if (Array.isArray(doc.visibleTo)) {
                                visibleToText = users.filter(u => doc.visibleTo.includes(u.id)).map(u => u.name).join(', ');
                            } else {
                                visibleToText = 'Mindenki';
                            }
                            return (
                                <tr key={doc.id}>
                                    <td>{doc.name}</td>
                                    <td>{doc.category}</td>
                                    <td>{doc.uploadDate}</td>
                                    <td>{visibleToText}</td>
                                    <td className="actions">
                                        <a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" download>Megnyitás</a>
                                        <button onClick={() => setEditingDoc(doc)} className="btn btn-secondary btn-small">Szerkesztés</button>
                                        <button onClick={() => handleDelete(doc.id)} className="btn btn-danger btn-small">Törlés</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
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
            alert('Válasszon ki legalább egy címzettet.');
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
                            <span>Mindenki</span>
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
                            aria-label="Félkövér"
                        >
                            B
                        </button>
                        <button
                            type="button"
                            className="format-btn italic"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => applyCommand('italic')}
                            aria-label="Dőlt"
                        >
                            I
                        </button>
                        <button
                            type="button"
                            className="format-btn underline"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => applyCommand('underline')}
                            aria-label="Aláhúzott"
                        >
                            U
                        </button>
                        <select
                            className="font-select"
                            value={fontFamily}
                            onChange={handleFontChange}
                            aria-label="Betűtípus"
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
                            aria-label="Betűszín"
                            title="Betűszín"
                        />
                        <input
                            type="color"
                            className="color-input"
                            value={highlightColor}
                            onChange={handleHighlightChange}
                            aria-label="Háttérszín"
                            title="Háttérszín"
                        />
                        <button
                            type="button"
                            className="format-btn clear"
                            onMouseDown={event => event.preventDefault()}
                            onClick={handleClearFormatting}
                            aria-label="Formázás törlése"
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
                        <button className="btn btn-primary" onClick={handleSend} disabled={recipientIds.length === 0}>{editing ? 'Mentés' : 'Küldés'}</button>
                        {editing && <button className="btn" onClick={cancelEdit}>Mégse</button>}
                    </div>
                </div>
            )}
            <div className="messages-list">
                {messages.map(m => {
                    const recips = users.filter(u => m.recipientIds.includes(u.id));
                    const names = recips.map(r => r.name).join(', ');
                    return (
                        <div key={m.id} className={`message-item${unreadIds.includes(m.id) ? ' unread' : ''}`}>
                            <div className="meta">{new Date(m.createdAt).toLocaleString()} – {names}</div>
                            <div className="content" dangerouslySetInnerHTML={{ __html: m.content }} />
                            {canPost && (
                                <div className="actions">
                                    <button className="action-btn" onClick={() => startEdit(m)} aria-label="Szerkesztés">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    </button>
                                    <button className="action-btn delete" onClick={() => onRemoveMessage(trip.id, m.id)} aria-label="Törlés">
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
                    showStatus({ type: 'error', message: 'Nem sikerült feltölteni a fájlt. Kérjük, próbálja meg újra.' });
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
                showStatus({ type: 'success', message: 'Fájl eltávolítva. Töltsön fel új dokumentumot.' });
            } catch (error) {
                console.error(error);
                setFormData(prev => ({ ...prev, [fieldId]: previousValue }));
                showStatus({ type: 'error', message: 'Nem sikerült eltávolítani a fájlt. Kérjük, próbálja meg újra.' });
            } finally {
                setDeletingField(null);
            }
        };

        const handleBlur = (fieldId: string) => {
            onUpdateRecord({ userId: user.id, fieldId, value: formData[fieldId], tripId: trip.id })
                .catch(() => {
                    showStatus({ type: 'error', message: 'Nem sikerült elmenteni az adatokat. Kérjük, próbálja meg újra.' });
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
                showStatus({ type: 'success', message: 'Személyes adatok sikeresen mentve.' });
            } catch (error) {
                console.error(error);
                showStatus({ type: 'error', message: 'Nem sikerült elmenteni az adatokat. Kérjük, próbálja meg újra.' });
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
                            Feltöltve: <a href={`${API_BASE}/api/users/${user.id}/personal-data/${config.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer">{getFileName(formData[config.id])}</a>
                            <button
                                type="button"
                                className="btn remove-file-btn"
                                onClick={() => handleFileDelete(config.id)}
                                disabled={isLocked || deletingField === config.id || uploadingField === config.id}
                            >
                                Fájl eltávolítása
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
                    placeholder={isLocked ? 'Zárolva' : ''}
                />
            )
        );

        return (
            <div className="personal-data-page">
                <h2>Személyes adatok a(z) {trip.name} utazáshoz</h2>
                <p>Kérjük, töltse ki az alábbi mezőket a foglalások véglegesítéséhez.</p>
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
                            <h3>Útlevél</h3>
                            <button type="button" className="btn scan-passport-btn" onClick={() => setShowPassportReader(true)}>Útlevél beolvasása</button>
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
                            {isSaving ? 'Mentés…' : 'Mentés'}
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
                <h2>Résztvevők személyes adatai: {trip.name}</h2>
                <p>Nincsenek résztvevők ehhez az utazáshoz.</p>
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
                            aria-label={record?.isLocked ? 'Mező feloldása' : 'Mező zárolása'}
                        >
                            {record?.isLocked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            )}
                        </button>
                        {config.type !== 'file' && record?.value && !record?.isLocked && (
                            <button className="edit-btn" onClick={() => startFieldEdit(config.id, record.value)} aria-label="Szerkesztés">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
                            </button>
                        )}
                    </div>
                </div>
                {config.type === 'file' ? (
                    <div>
                        {record?.value && (
                            <div>
                                <a href={`${API_BASE}/api/users/${participant.id}/personal-data/${config.id}/file?token=${user.token || ''}`} className="file-link">{record.value}</a>
                                <button className="remove-file" onClick={() => handleRemoveFile(participant.id, config.id)}>Remove</button>
                            </div>
                        )}
                        {!record?.isLocked && (
                            <input type="file" onChange={e => handleTravelerFileChange(participant.id, config.id, e.target.files ? e.target.files[0] : null)} />
                        )}
                    </div>
                ) : isEditing && !record?.isLocked ? (
                    <div className="field-edit">
                        <input type={config.type} value={draft} onChange={e => handleDraftChange(config.id, e.target.value)} />
                        <button className="save-btn" onClick={() => saveFieldEdit(participant.id, config.id)} aria-label="Mentés">
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
            <h2>Résztvevők személyes adatai: {trip.name}</h2>
            <div className={`field-manager ${fieldManagerOpen ? 'expanded' : 'collapsed'}`}>
                <div className="field-manager-header">
                    <h3>Mezők kezelése</h3>
                    <button
                        type="button"
                        className="field-manager-toggle"
                        onClick={() => setFieldManagerOpen(open => !open)}
                        aria-expanded={fieldManagerOpen}
                    >
                        <span>{fieldManagerOpen ? 'Elrejtés' : 'Megnyitás'}</span>
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
                    <p className="field-manager-hint">A mezők módosításához nyissa meg a kezelőpanelt.</p>
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
                                                <option value="text">Szöveg</option>
                                                <option value="date">Dátum</option>
                                                <option value="file">Fájl</option>
                                                <option value="radio">Egyszeres választás</option>
                                                <option value="multi">Több választás</option>
                                            </select>
                                            {(editType === 'radio' || editType === 'multi') && (
                                                <input placeholder="Opciók, vesszővel" value={editOptions} onChange={e => setEditOptions(e.target.value)} />
                                            )}
                                            <div className="config-actions">
                                                <button className="btn btn-small" onClick={() => saveEdit(c)}>Mentés</button>
                                                <button className="btn btn-small" onClick={cancelEdit}>Mégse</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="config-label">{c.label} <small>({c.type})</small></span>
                                            {!c.locked && (
                                                <div className="config-actions">
                                                    <button className="btn btn-small" onClick={() => startEdit(c)}>Szerkesztés</button>
                                                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteField(c)}>Törlés</button>
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
                            <input placeholder="Címke" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
                            <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                                <option value="text">Szöveg</option>
                                <option value="date">Dátum</option>
                                <option value="file">Fájl</option>
                                <option value="radio">Egyszeres választás</option>
                                <option value="multi">Több választás</option>
                            </select>
                            {(newFieldType === 'radio' || newFieldType === 'multi') && (
                                <input placeholder="Opciók, vesszővel elválasztva" value={newFieldOptions} onChange={e => setNewFieldOptions(e.target.value)} />
                            )}
                            <button className="btn" onClick={handleAddField}>Hozzáadás</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="traveler-select">
                <label htmlFor="travelerSelect">Résztvevő</label>
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
                            <h4>Útlevél</h4>
                            <button type="button" className="btn scan-passport-btn" onClick={() => setShowPassportReader(true)}>Útlevél beolvasása</button>
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
                                    <label>Megjegyzés</label>
                                    {remarkEditing ? (
                                        <button className="save-btn" onClick={() => saveRemark(participant.id)} aria-label="Mentés">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </button>
                                    ) : (
                                        <button className="edit-btn" onClick={() => startRemarkEdit(remarkRecord?.value || '')} aria-label="Szerkesztés">
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
                                    <span className="print-label">Megjegyzés:</span> <span className="print-value">{remarkRecord?.value}</span>
                                </div>
                            </div>
                        );
                    })()}
                    <div className="personal-data-actions">
                        <button className="btn btn-secondary" onClick={handlePrint}>Nyomtatás</button>
                        <button className="btn btn-secondary" onClick={handlePrint}>PDF mentése</button>
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
            <h2>Fájlok</h2>
            <div className="form-group">
                <label htmlFor="fileUser">Felhasználó</label>
                <select id="fileUser" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                    <option value="">Összes</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
            <div className="table-container">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th>Név</th>
                            <th>Felhasználó</th>
                            <th>Utazás</th>
                            <th>Kategória</th>
                            <th>Dátum</th>
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
                                <td><a href={`${API_BASE}/api/documents/${doc.id}/file?token=${user.token || ''}`} target="_blank" rel="noopener noreferrer">Letöltés</a></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Sidebar = ({
    trips,
    selectedTripId,
    activeView,
    onSelectTrip,
    onSelectView,
    onShowTrips,
    onShowUsers,
    onShowFiles,
    onShowAccount,
    onShowSiteSettings,
    mainView,
    userRole,
    userId,
    isOpen,
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
    onSelectTrip: (id: string) => void,
    onSelectView: (view: TripView) => void,
    onShowTrips: () => void,
    onShowUsers: () => void,
    onShowFiles: () => void,
    onShowAccount: () => void,
    onShowSiteSettings: () => void,
    mainView: 'trips' | 'users' | 'files' | 'account' | 'site',
    userRole: Role,
    userId: string,
    isOpen: boolean,
    onLogout: () => void,
    unreadCounts: Record<string, number>,
    theme: Theme,
    currentTheme: 'light' | 'dark',
    onThemeChange: (theme: Theme) => void,
    logos: SiteSettings | null
}) => {

    return (
        <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
            <div className="sidebar-logo">
                {(() => {
                    const src = currentTheme === 'dark' ? (logos?.logoDark || logos?.logoLight) : (logos?.logoLight || logos?.logoDark);
                    return src ? <img src={src} alt="myTrip logo" /> : <h2>myTrip</h2>;
                })()}
            </div>
            <nav>
                <ul className="main-nav-list">
                    <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowTrips(); }} className={mainView === 'trips' ? 'active' : ''}>
                           Utazásaid
                        </a>
                        {mainView === 'trips' && (
                          <ul className="trip-nav-list">
                            {trips.map(trip => {
                              const tripNavItems: { key: TripView; label: string }[] = [
                                { key: 'summary', label: 'Összegzés' },
                                { key: 'itinerary', label: 'Útiterv' },
                                { key: 'financials', label: 'Pénzügyek' },
                                { key: 'personalData', label: 'Személyes adatok' },
                                { key: 'documents', label: 'Dokumentumok' },
                                { key: 'messages', label: 'Üzenetek' },
                              ];
                              if (userRole === 'admin' || (userRole === 'organizer' && trip.organizerIds.includes(userId))) {
                                tripNavItems.push({ key: 'contact', label: 'Kapcsolat' });
                                tripNavItems.push({ key: 'users', label: 'Utasok' });
                                tripNavItems.push({ key: 'settings', label: 'Beállítások' });
                              }
                              return (
                                <li key={trip.id} className={`trip-item ${trip.id === selectedTripId ? 'active' : ''}`}>
                                  <a href="#" onClick={(e) => { e.preventDefault(); onSelectTrip(trip.id); }}>
                                    {trip.name}
                                  </a>
                                  {trip.id === selectedTripId && (
                                    <ul className="trip-submenu">
                                      {tripNavItems.map(item => (
                                        <li key={item.key}>
                                          <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); onSelectView(item.key); }}
                                            className={activeView === item.key ? 'active' : ''}
                                          >
                                            {item.label}
                                            {item.key === 'messages' && unreadCounts[trip.id] > 0 && (
                                              <span className="unread-badge">{unreadCounts[trip.id]}</span>
                                            )}
                                          </a>
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
                    {(userRole === 'admin' || userRole === 'organizer') && (
                      <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowFiles(); }} className={mainView === 'files' ? 'active' : ''}>
                          Fájlok
                        </a>
                      </li>
                    )}
                    {userRole === 'admin' && (
                      <>
                      <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowUsers(); }} className={mainView === 'users' ? 'active' : ''}>
                          Felhasználók
                        </a>
                      </li>
                      <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowSiteSettings(); }} className={mainView === 'site' ? 'active' : ''}>
                          Oldal beállítások
                        </a>
                      </li>
                      </>
                    )}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onShowAccount();
                    }}
                    className={mainView === 'account' ? 'active' : ''}
                >
                    Beállítások
                </a>
                <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
                <button onClick={onLogout} className="btn btn-logout">Kijelentkezés</button>
            </div>
        </aside>
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
  const [isModalOpen, setModalOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteRefresh, setInviteRefresh] = useState(0);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [mainView, setMainView] = useState<'trips' | 'users' | 'files' | 'account' | 'site'>('trips');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [activeTripView, setActiveTripView] = useState<TripView>('summary');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userRefresh, setUserRefresh] = useState(0);
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(m => {
      if (!m.readBy.includes(String(user.id))) {
        counts[m.tripId] = (counts[m.tripId] || 0) + 1;
      }
    });
    return counts;
  }, [messages, user.id]);

  const tripMessages = useMemo(
    () => messages
      .filter(m => m.tripId === selectedTripId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [messages, selectedTripId]
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/logo`)
      .then(res => res.json())
      .then(setSiteSettings)
      .catch(() => {});
  }, []);

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

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find(t => t.id === selectedTripId);
  }, [selectedTripId, trips]);

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

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setActiveTripView('summary');
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleSelectView = (view: TripView) => {
    setActiveTripView(view);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleShowTrips = () => {
    setMainView('trips');
    setSelectedTripId(null);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  }

  const handleShowUsers = () => {
    setMainView('users');
    setSelectedTripId(null);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  }

  const handleShowAccount = () => {
    setMainView('account');
    setSelectedTripId(null);
    setMobileSidebarOpen(false);
  }

  const handleShowSiteSettings = () => {
    setMainView('site');
    setSelectedTripId(null);
    setMobileSidebarOpen(false);
  }

  const handleShowFiles = () => {
    setMainView('files');
    setSelectedTripId(null);
    setMobileSidebarOpen(false);
  }

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
                return <p>Nincs jogosultsága a felhasználók kezeléséhez.</p>;
              }
              return <TripUserManagement trip={selectedTrip} users={allUsers} currentUser={user} onChange={() => { refreshTrips(); setUserRefresh(v => v + 1); }} />;
            case 'contact':
              return <TripContactInfo user={user} onSaved={() => setUserRefresh(v => v + 1)} />;
            case 'settings':
              return <TripSettings trip={selectedTrip} user={user} onUpdated={refreshTrips} onDeleted={() => { setSelectedTripId(null); refreshTrips(); }} />;
            default: return <h2>Válasszon nézetet</h2>;
        }
    }

    return (
        <>
            {paymentFeedback && (
                <div className={`floating-feedback ${paymentFeedback.type}`} role="status">
                    <span>{paymentFeedback.message}</span>
                    <button type="button" onClick={onDismissPaymentFeedback} aria-label="Uzenet bezarasa">×</button>
                </div>
            )}
            <section className="dashboard-overview-hero">
                <div className="dashboard-overview-copy">
                    <span className="section-eyebrow">Travel operations board</span>
                    <h2>Utak, utasok és befizetések végre egy nyugodt, profi felületen</h2>
                    <p>
                        A napi szervezéshez kellő legfontosabb jeleket kapod meg először: mennyi út él, hol van nyitott kommunikáció, mi történt a befizetésekkel.
                    </p>
                    <div className="dashboard-overview-actions">
                        {user.role === 'admin' && (
                            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                                Új utazás
                            </button>
                        )}
                        {(user.role === 'admin' || user.role === 'organizer') && (
                            <button onClick={() => setInviteOpen(true)} className="btn btn-secondary">
                                Meghívó küldése
                            </button>
                        )}
                    </div>
                </div>
                <div className="dashboard-overview-rail">
                    <div className="dashboard-overview-stats">
                        <div className="overview-stat-card">
                            <span>Aktív utak</span>
                            <strong>{overviewMetrics.tripCount}</strong>
                        </div>
                        <div className="overview-stat-card">
                            <span>Olvasatlan üzenetek</span>
                            <strong>{overviewMetrics.unreadMessages}</strong>
                        </div>
                        <div className="overview-stat-card">
                            <span>Online fizetések</span>
                            <strong>{overviewMetrics.onlinePaymentsCount}</strong>
                        </div>
                        <div className="overview-stat-card">
                            <span>Egyenleg</span>
                            <strong>{overviewMetrics.myBalance.toLocaleString()} HUF</strong>
                        </div>
                    </div>
                    <div className="dashboard-overview-note">
                        <span className="dashboard-overview-note-label">Kiemelt út</span>
                        <strong>{featuredTrip ? featuredTrip.name : 'Még nincs kiválasztható út'}</strong>
                        <p>
                            {featuredTrip
                                ? `${formatDisplayDate(featuredTrip.startDate)} - ${formatDisplayDate(featuredTrip.endDate)} · ${getTripStageMeta(featuredTrip).summary}`
                                : 'Amint lesz aktív vagy közelgő út, itt jelenik meg a legfontosabb fókusz.'}
                        </p>
                    </div>
                </div>
            </section>
            <div className="dashboard-header">
                <div>
                    <h2>Aktív utak</h2>
                    <p className="dashboard-header-intro">Válassz egy utat, és onnan nyisd meg az útitervet, dokumentumokat, pénzügyeket vagy a traveler adatokat.</p>
                </div>
            </div>
            <div className="trip-list">
                {visibleTrips.length > 0 ? (
                visibleTrips.map((trip: Trip) => (
                    <React.Fragment key={trip.id}>
                        <TripCard
                            trip={trip}
                            onSelectTrip={() => handleSelectTrip(trip.id)}
                        />
                    </React.Fragment>
                ))
                ) : (
                <p className="no-trips">Nincsenek megjeleníthető utazások.</p>
                )}
            </div>
        </>
    );
  };

  return (
     <div className={`dashboard-layout with-sidebar ${isMobileSidebarOpen ? 'sidebar-is-open' : ''}`}>
        <Sidebar
            trips={visibleTrips}
            selectedTripId={selectedTripId}
            activeView={activeTripView}
            onSelectTrip={handleSelectTrip}
            onSelectView={handleSelectView}
            onShowTrips={handleShowTrips}
            onShowUsers={handleShowUsers}
            onShowFiles={handleShowFiles}
            onShowAccount={handleShowAccount}
            onShowSiteSettings={handleShowSiteSettings}
            mainView={mainView}
            userRole={user.role}
            userId={String(user.id)}
            isOpen={isMobileSidebarOpen}
            onLogout={onLogout}
            unreadCounts={unreadCounts}
            theme={theme}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            logos={siteSettings}
        />
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
        <div className="dashboard-container">
          <Header
            user={user}
            onToggleSidebar={() => setMobileSidebarOpen(true)}
            showHamburger={true}
          />
          <main className="dashboard-content">
            {renderContent()}
          </main>
          {user.role === 'admin' && (
            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
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
