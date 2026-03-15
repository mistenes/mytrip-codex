import React, { useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import Dashboard from "./components/Dashboard";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ProblemReportButton from "./components/ProblemReportButton";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ResetPasswordConfirmPage from "./components/ResetPasswordConfirmPage";
import BetaBanner from "./components/BetaBanner";
import { INITIAL_TRIPS, INITIAL_FINANCIAL_RECORDS, DEFAULT_PERSONAL_DATA_FIELD_CONFIGS, INITIAL_PERSONAL_DATA_RECORDS, INITIAL_ITINERARY_ITEMS, INITIAL_MESSAGES } from "./mockData";
import { User, Trip, FinancialRecord, Document, PersonalDataRecord, PersonalDataFieldConfig, PersonalDataUpdatePayload, ItineraryItem, Theme, Message, PaymentTransaction } from "./types";
import { API_BASE, SESSION_EXPIRED_EVENT } from "./api";

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme !== 'auto') {
    return theme;
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const refreshTrips = () => {
    if (!currentUser) {
      setTrips([]);
      return;
    }

    fetch(`${API_BASE}/api/trips`)
      .then(res => res.json())
      .then(data => setTrips(data.map((t: any) => ({
        id: t._id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        organizerIds: t.organizerIds || [],
        organizerNames: t.organizerNames || [],
        travelerIds: t.travelerIds || [],
        emergencyContacts: (t.emergencyContacts || []).map((c: any) => ({
          id: String(c.id || c._id || ''),
          firstName: c.firstName,
          lastName: c.lastName,
          name: c.name,
          contactTitle: c.contactTitle,
          contactPhone: c.contactPhone,
          contactEmail: c.contactEmail,
        }))
      }))))
      .catch(err => console.error('Failed to fetch trips', err));
  };

  const refreshFinancials = () => {
    if (!currentUser) {
      setFinancialRecords([]);
      return Promise.resolve();
    }

    return fetch(`${API_BASE}/api/financials`)
      .then(res => res.json())
      .then(data => setFinancialRecords(data.map((r: any) => ({
        id: r.id,
        tripId: r.tripId,
        userId: r.userId,
        description: r.description,
        amount: r.amount,
        date: r.date,
      }))))
      .catch(() => {});
  };

  const refreshPaymentTransactions = () => {
    if (!currentUser) {
      setPaymentTransactions([]);
      return Promise.resolve();
    }

    return fetch(`${API_BASE}/api/payment-transactions`)
      .then(res => res.json())
      .then(data => setPaymentTransactions(data.map((transaction: any) => ({
        id: transaction.id,
        tripId: transaction.tripId,
        userId: transaction.userId,
        provider: transaction.provider,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        status: transaction.status,
        providerReference: transaction.providerReference,
        providerPaymentReference: transaction.providerPaymentReference,
        financialRecordId: transaction.financialRecordId,
        approvalUrl: transaction.approvalUrl,
        completedAt: transaction.completedAt,
        createdAt: transaction.createdAt,
      }))))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isSessionLoading) {
      refreshTrips();
    }
  }, [currentUser, isSessionLoading]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [personalDataRecords, setPersonalDataRecords] = useState<PersonalDataRecord[]>(INITIAL_PERSONAL_DATA_RECORDS);
  const [personalDataConfigs, setPersonalDataConfigs] = useState<PersonalDataFieldConfig[]>(DEFAULT_PERSONAL_DATA_FIELD_CONFIGS);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>(INITIAL_ITINERARY_ITEMS);
  const [theme, setTheme] = useState<Theme>('auto');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => getResolvedTheme('auto'));

  useEffect(() => {
    fetch(`${API_BASE}/api/session`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setCurrentUser(data))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsSessionLoading(false));
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  useEffect(() => {
    setTheme(currentUser?.themePreference || 'auto');
  }, [currentUser?.id, currentUser?.themePreference]);

  useEffect(() => {
    const applyTheme = (t: Theme) => {
      const resolved = getResolvedTheme(t);
      document.documentElement.setAttribute('data-theme', resolved);
      setCurrentTheme(resolved);
    };

    applyTheme(theme);

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) {
      setPersonalDataConfigs(DEFAULT_PERSONAL_DATA_FIELD_CONFIGS);
      return;
    }

    fetch(`${API_BASE}/api/field-config`)
      .then(res => res.json())
      .then(data => setPersonalDataConfigs(data.map((c: any) => ({
        id: c.field,
        tripId: String(c.tripId),
        label: c.label,
        type: c.type,
        enabled: c.enabled,
        locked: c.locked,
        order: c.order,
        options: c.options,
        section: c.section,
      }))))
      .catch(() => { });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setPersonalDataRecords([]);
      return;
    }

    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => {
        const records: PersonalDataRecord[] = [];
        data.forEach((u: any) => {
          (u.personalData || []).forEach((pd: any) => {
            records.push({ userId: u._id, fieldId: pd.field, value: pd.value, isLocked: pd.locked });
          });
        });
        setPersonalDataRecords(records);
      })
      .catch(() => { });
  }, [currentUser]);

  useEffect(() => {
    refreshFinancials();
  }, [currentUser]);

  useEffect(() => {
    refreshPaymentTransactions();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE}/api/documents`)
        .then(res => res.json())
        .then(data => setDocuments(data.map((d: any) => ({
          id: d.id,
          tripId: d.tripId,
          name: d.name,
          category: d.category,
          uploadDate: d.uploadDate,
          fileName: d.fileName,
          visibleTo: d.visibleTo,
          uploadedBy: d.uploadedBy,
        }))))
        .catch(() => { });
    } else {
      setDocuments([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE}/api/itinerary`)
        .then(res => res.json())
        .then(data => setItineraryItems(data.map((i: any) => ({
          id: i.id,
          tripId: i.tripId,
          title: i.title,
          description: i.description,
          startDateTimeLocal: i.startDateTimeLocal,
          endDateTimeLocal: i.endDateTimeLocal,
          location: i.location,
          timeZone: i.timeZone,
          programType: i.programType || 'required',
        }))))
        .catch(() => { });
    } else {
      setItineraryItems([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE}/api/messages`)
        .then(res => res.json())
        .then(data => setMessages(data.map((m: any) => ({
          id: m.id,
          tripId: m.tripId,
          authorId: m.authorId,
          recipientIds: m.recipientIds,
          content: m.content,
          createdAt: m.createdAt,
          readBy: m.readBy,
        })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
        .catch(() => { });
    } else {
      setMessages([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const paymentState = searchParams.get('payment');

    if (!paymentState) {
      return;
    }

    let cancelled = false;

    const finalize = async () => {
      try {
        if (paymentState === 'paypal-return') {
          const orderId = searchParams.get('token') || '';
          const paymentTransactionId = searchParams.get('paymentTransactionId') || '';
          const res = await fetch(`${API_BASE}/api/payments/paypal/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, paymentTransactionId }),
          });

          if (!res.ok) {
            throw new Error('paypal_capture_failed');
          }

          await Promise.all([refreshFinancials(), refreshPaymentTransactions()]);
          if (!cancelled) {
            setPaymentFeedback({ type: 'success', message: 'A PayPal befizetes sikeresen jovairasra kerult.' });
          }
        } else if (paymentState === 'stripe-success') {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
          await Promise.all([refreshFinancials(), refreshPaymentTransactions()]);
          if (!cancelled) {
            setPaymentFeedback({ type: 'success', message: 'A Stripe fizetes visszaigazolasa elindult, az egyenleg frissult.' });
          }
        } else if (paymentState === 'stripe-cancel' || paymentState === 'paypal-cancel') {
          if (!cancelled) {
            setPaymentFeedback({ type: 'info', message: 'A fizetesi folyamat megszakadt, nem tortent jovairas.' });
          }
        }
      } catch {
        if (!cancelled) {
          setPaymentFeedback({ type: 'error', message: 'A fizetes feldolgozasa nem sikerult. Kerjuk, ellenorizd az egyenleget es probald ujra.' });
        }
      } finally {
        if (!cancelled) {
          navigate(location.pathname, { replace: true });
        }
      }
    };

    void finalize();

    return () => {
      cancelled = true;
    };
  }, [currentUser, location.pathname, location.search, navigate]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    fetch(`${API_BASE}/api/logout`, { method: 'POST' }).catch(() => { });
    setCurrentUser(null);
  };

  const handleCreateTrip = (newTrip: Trip) => {
    setTrips(prevTrips => [...prevTrips, newTrip]);
  };

  const handleThemeChange = async (nextTheme: Theme) => {
    setTheme(nextTheme);

    if (!currentUser) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/${currentUser.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: nextTheme }),
      });

      if (!res.ok) {
        throw new Error('save_theme_failed');
      }

      const updatedUser = await res.json();
      setCurrentUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
    } catch {
      setTheme(currentUser.themePreference || 'auto');
    }
  };

  const handleDismissBetaBanner = async () => {
    if (!currentUser) {
      return;
    }

    setCurrentUser((prev) => (prev ? { ...prev, betaBannerDismissed: true } : prev));

    try {
      const res = await fetch(`${API_BASE}/api/users/${currentUser.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betaBannerDismissed: true }),
      });

      if (!res.ok) {
        throw new Error('save_banner_preference_failed');
      }
    } catch {
      setCurrentUser((prev) => (prev ? { ...prev, betaBannerDismissed: false } : prev));
    }
  };

  const handleAddFinancialRecord = async (newRecordData: Omit<FinancialRecord, 'id'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/trips/${newRecordData.tripId}/financials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecordData)
    });
    if (res.ok) {
      const r = await res.json();
      setFinancialRecords(prev => [...prev, {
        id: r.id,
        tripId: r.tripId,
        userId: r.userId,
        description: r.description,
        amount: r.amount,
        date: r.date,
      }]);
    } else {
      throw new Error('Could not add the financial record.');
    }
  };

  const handleUpdateFinancialRecord = async (id: string, updatedData: Omit<FinancialRecord, 'id'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/financials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    if (!res.ok) {
      const message = await res.json().catch(() => null);
      throw new Error(message?.message || 'Could not update the financial record.');
    }
    const r = await res.json();
    setFinancialRecords(prev => prev.map(record => record.id === id ? {
      id: r.id,
      tripId: r.tripId,
      userId: r.userId,
      description: r.description,
      amount: r.amount,
      date: r.date,
    } : record));
  };

  const handleRemoveFinancialRecord = async (id: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/financials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Could not delete the financial record.');
    }
    setFinancialRecords(prev => prev.filter(record => record.id !== id));
  };

  const handleAddDocument = async (tripId: string, data: { name: string; category: string; visibleTo: 'all' | string[]; file: File }) => {
    if (!currentUser) return;
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('visibleTo', JSON.stringify(data.visibleTo));
    formData.append('file', data.file);
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/documents`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const d = await res.json();
      setDocuments(prev => [...prev, {
        id: d.id,
        tripId: d.tripId,
        name: d.name,
        category: d.category,
        uploadDate: d.uploadDate,
        fileName: d.fileName,
        visibleTo: d.visibleTo,
        uploadedBy: d.uploadedBy,
      }]);
    }
  };

  const handleUpdateDocument = async (updated: Document, file?: File) => {
    if (!currentUser) return;
    const formData = new FormData();
    formData.append('name', updated.name);
    formData.append('category', updated.category);
    formData.append('visibleTo', JSON.stringify(updated.visibleTo));
    if (file) formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/documents/${updated.id}`, {
      method: 'PUT',
      body: formData
    });
    if (res.ok) {
      const d = await res.json();
      setDocuments(prev => prev.map(doc => doc.id === updated.id ? {
        id: d.id,
        tripId: d.tripId,
        name: d.name,
        category: d.category,
        uploadDate: d.uploadDate,
        fileName: d.fileName,
        visibleTo: d.visibleTo,
        uploadedBy: d.uploadedBy,
      } : doc));
    }
  };

  const handleRemoveDocument = async (id: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleUpdatePersonalData = async (updatedRecord: PersonalDataUpdatePayload) => {
    const res = await fetch(`${API_BASE}/api/users/${updatedRecord.userId}/personal-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: updatedRecord.fieldId, value: updatedRecord.value, tripId: updatedRecord.tripId })
    });
    if (!res.ok) {
      throw new Error('Failed to save personal data');
    }
    setPersonalDataRecords(prev => {
      const { tripId: _tripId, ...record } = updatedRecord;
      const existingIndex = prev.findIndex(r => r.userId === record.userId && r.fieldId === record.fieldId);
      if (existingIndex > -1) {
        const newRecords = [...prev];
        newRecords[existingIndex] = { ...newRecords[existingIndex], value: record.value };
        return newRecords;
      } else {
        return [...prev, { ...record, isLocked: false }];
      }
    });
  };

  const handleUpsertPersonalDataConfig = (config: PersonalDataFieldConfig) => {
    setPersonalDataConfigs(prev => {
      const idx = prev.findIndex(c => c.id === config.id);
      const updated = idx > -1 ? [...prev.slice(0, idx), config, ...prev.slice(idx + 1)] : [...prev, config];
      return [...updated].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  };

  const handleRemovePersonalDataConfig = (id: string, tripId: string) => {
    setPersonalDataConfigs(prev => prev.filter(c => !(c.id === id && c.tripId === tripId)));
  };

  const handleTogglePersonalDataLock = (userId: string, fieldId: string) => {
    setPersonalDataRecords(prev =>
      prev.map(record => {
        if (record.userId === userId && record.fieldId === fieldId) {
          return { ...record, isLocked: !record.isLocked };
        }
        return record;
      })
    );
    const record = personalDataRecords.find(r => r.userId === userId && r.fieldId === fieldId);
    fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/lock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: !(record?.isLocked) })
    }).catch(() => { });
  };

  const handleAddItineraryItem = async (newItemData: Omit<ItineraryItem, 'id'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/trips/${newItemData.tripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData),
    });
    if (res.ok) {
      const item = await res.json();
      setItineraryItems(prev => [...prev, item]);
    }
  };

  const handleUpdateItineraryItem = async (id: string, updatedData: Omit<ItineraryItem, 'id' | 'tripId'>) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/itinerary/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    if (res.ok) {
      const item = await res.json();
      setItineraryItems(prev => prev.map(existing => existing.id === id ? item : existing));
    }
  };

  const handleRemoveItineraryItem = async (idToRemove: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/itinerary/${idToRemove}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setItineraryItems(prev => prev.filter(item => item.id !== idToRemove));
    }
  };

  const handleAddMessage = async (tripId: string, recipientIds: string[], content: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, recipientIds }),
    });
    if (res.ok) {
      const m = await res.json();
      setMessages(prev => [{
        id: m.id,
        tripId: m.tripId,
        authorId: m.authorId,
        recipientIds: m.recipientIds,
        content: m.content,
        createdAt: m.createdAt,
        readBy: m.readBy,
      }, ...prev]);
    }
  };

  const handleUpdateMessage = async (tripId: string, id: string, recipientIds: string[], content: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, recipientIds }),
    });
    if (res.ok) {
      const m = await res.json();
      setMessages(prev => prev.map(msg => msg.id === id ? {
        id: m.id,
        tripId: m.tripId,
        authorId: m.authorId,
        recipientIds: m.recipientIds,
        content: m.content,
        createdAt: m.createdAt,
        readBy: m.readBy,
      } : msg));
    }
  };

  const handleRemoveMessage = async (tripId: string, id: string) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/trips/${tripId}/messages/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    if (!currentUser) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, readBy: [...m.readBy, currentUser.id] } : m));
    await fetch(`${API_BASE}/api/messages/${id}/read`, {
      method: 'POST',
    }).catch(() => { });
  };

  const handleStartStripePayment = async (tripId: string, amount: number, description: string) => {
    if (!currentUser) {
      throw new Error('Nincs aktiv munkamenet.');
    }

    const res = await fetch(`${API_BASE}/api/trips/${tripId}/payments/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.checkoutUrl) {
      throw new Error(payload?.message || 'Nem sikerult Stripe fizetest inditani.');
    }

    window.location.href = payload.checkoutUrl;
  };

  const handleStartPaypalPayment = async (tripId: string, amount: number, description: string) => {
    if (!currentUser) {
      throw new Error('Nincs aktiv munkamenet.');
    }

    const res = await fetch(`${API_BASE}/api/trips/${tripId}/payments/paypal/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.approvalUrl) {
      throw new Error(payload?.message || 'Could not start the PayPal payment.');
    }

    window.location.href = payload.approvalUrl;
  };

  if (isSessionLoading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>myTrip</h1>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  const protectedElement = !currentUser ? (
    <LoginPage onLogin={handleLogin} theme={currentTheme} onToggleTheme={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')} />
  ) : currentUser.mustChangePassword ? (
    <ChangePasswordPage user={currentUser} onSuccess={() => setCurrentUser({ ...currentUser, mustChangePassword: false })} />
  ) : (
    <Dashboard
      user={currentUser}
      trips={trips}
      refreshTrips={refreshTrips}
      onLogout={handleLogout}
      onCreateTrip={handleCreateTrip}
      financialRecords={financialRecords}
      paymentTransactions={paymentTransactions}
      onAddFinancialRecord={handleAddFinancialRecord}
      onUpdateFinancialRecord={handleUpdateFinancialRecord}
      onRemoveFinancialRecord={handleRemoveFinancialRecord}
      onStartStripePayment={handleStartStripePayment}
      onStartPaypalPayment={handleStartPaypalPayment}
      documents={documents}
      onAddDocument={handleAddDocument}
      onUpdateDocument={handleUpdateDocument}
      onRemoveDocument={handleRemoveDocument}
      personalDataConfigs={personalDataConfigs}
      personalDataRecords={personalDataRecords}
      onUpdatePersonalData={handleUpdatePersonalData}
      onTogglePersonalDataLock={handleTogglePersonalDataLock}
      onUpsertPersonalDataConfig={handleUpsertPersonalDataConfig}
      onRemovePersonalDataConfig={handleRemovePersonalDataConfig}
      itineraryItems={itineraryItems}
      onAddItineraryItem={handleAddItineraryItem}
      onUpdateItineraryItem={handleUpdateItineraryItem}
      onRemoveItineraryItem={handleRemoveItineraryItem}
      messages={messages}
      onAddMessage={handleAddMessage}
      onUpdateMessage={handleUpdateMessage}
      onRemoveMessage={handleRemoveMessage}
      onMarkMessageRead={handleMarkMessageRead}
      theme={theme}
      onThemeChange={handleThemeChange}
      currentTheme={currentTheme}
      paymentFeedback={paymentFeedback}
      onDismissPaymentFeedback={() => setPaymentFeedback(null)}
    />
  );

  return (
    <>
      {currentUser && !currentUser.betaBannerDismissed && (
        <BetaBanner onDismiss={handleDismissBetaBanner} />
      )}
      <Routes>
        <Route path="/" element={!currentUser ? <LoginPage onLogin={handleLogin} theme={currentTheme} onToggleTheme={() => handleThemeChange(currentTheme === 'dark' ? 'light' : 'dark')} /> : currentUser.mustChangePassword ? <ChangePasswordPage user={currentUser} onSuccess={() => setCurrentUser({ ...currentUser, mustChangePassword: false })} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/confirm" element={<ResetPasswordConfirmPage />} />
        <Route path="*" element={protectedElement} />
      </Routes>
      <ProblemReportButton />
    </>
  );
};

export default App;
