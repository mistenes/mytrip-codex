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
  { id: 'firstName', tripId: 'default', label: 'First name', type: 'text', locked: true, enabled: true, order: 1, section: 'passport' },
  { id: 'lastName', tripId: 'default', label: 'Last name', type: 'text', locked: true, enabled: true, order: 2, section: 'passport' },
  { id: 'dateOfBirth', tripId: 'default', label: 'Date of birth', type: 'date', locked: true, enabled: true, order: 3, section: 'passport' },
  { id: 'passportNumber', tripId: 'default', label: 'Passport number', type: 'text', enabled: true, order: 4, section: 'passport' },
  { id: 'issueDate', tripId: 'default', label: 'Issue date', type: 'date', enabled: false, order: 5, section: 'passport' },
  { id: 'issuingCountry', tripId: 'default', label: 'Issuing country', type: 'text', enabled: true, order: 6, section: 'passport' },
  { id: 'expiryDate', tripId: 'default', label: 'Expiry date', type: 'date', enabled: true, order: 7, section: 'passport' },
  { id: 'nationality', tripId: 'default', label: 'Nationality', type: 'text', enabled: true, order: 8, section: 'passport' },
  { id: 'sex', tripId: 'default', label: 'Sex', type: 'text', enabled: true, order: 9, section: 'passport' },
];
export const INITIAL_PERSONAL_DATA_RECORDS: PersonalDataRecord[] = [];
export const INITIAL_ITINERARY_ITEMS: ItineraryItem[] = [];

export const MOCK_CURRENT_USER = {
  admin: USERS.find(u => u.role === 'admin')!,
  organizer: USERS.find(u => u.role === 'organizer')!,
  traveler: USERS.find(u => u.role === 'traveler')!,
};
