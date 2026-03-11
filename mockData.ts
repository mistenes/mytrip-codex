import { User, Trip, FinancialRecord, Document, PersonalDataFieldConfig, PersonalDataRecord, ItineraryItem, Message } from './types';

export const USERS: User[] = [
  { id: '1', name: 'Admin', role: 'admin' },
  { id: '2', name: 'Organizer', role: 'organizer' },
  { id: '3', name: 'Traveler', role: 'traveler' },
];

export const INITIAL_TRIPS: Trip[] = [];
export const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_MESSAGES: Message[] = [];
export const DEFAULT_PERSONAL_DATA_FIELD_CONFIGS: PersonalDataFieldConfig[] = [
  { id: 'firstName', tripId: 'default', label: 'Keresztnév', type: 'text', locked: true, enabled: true, order: 1, section: 'passport' },
  { id: 'lastName', tripId: 'default', label: 'Vezetéknév', type: 'text', locked: true, enabled: true, order: 2, section: 'passport' },
  { id: 'dateOfBirth', tripId: 'default', label: 'Születési dátum', type: 'date', locked: true, enabled: true, order: 3, section: 'passport' },
  { id: 'passportNumber', tripId: 'default', label: 'Útlevélszám', type: 'text', enabled: true, order: 4, section: 'passport' },
  { id: 'issueDate', tripId: 'default', label: 'Kiadás dátuma', type: 'date', enabled: false, order: 5, section: 'passport' },
  { id: 'issuingCountry', tripId: 'default', label: 'Kibocsátó ország', type: 'text', enabled: true, order: 6, section: 'passport' },
  { id: 'expiryDate', tripId: 'default', label: 'Lejárati dátum', type: 'date', enabled: true, order: 7, section: 'passport' },
  { id: 'nationality', tripId: 'default', label: 'Állampolgárság', type: 'text', enabled: true, order: 8, section: 'passport' },
  { id: 'sex', tripId: 'default', label: 'Nem', type: 'text', enabled: true, order: 9, section: 'passport' },
];
export const INITIAL_PERSONAL_DATA_RECORDS: PersonalDataRecord[] = [];
export const INITIAL_ITINERARY_ITEMS: ItineraryItem[] = [];

export const MOCK_CURRENT_USER = {
  admin: USERS.find(u => u.role === 'admin')!,
  organizer: USERS.find(u => u.role === 'organizer')!,
  traveler: USERS.find(u => u.role === 'traveler')!,
};
