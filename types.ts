export type Role = 'admin' | 'organizer' | 'traveler';
export type TripView =
  | 'summary'
  | 'financials'
  | 'itinerary'
  | 'documents'
  | 'personalData'
  | 'messages'
  | 'contact'
  | 'users'
  | 'settings';
export type Theme = 'light' | 'dark' | 'auto';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactTitle?: string;
  contactShowEmergency?: boolean;
  role: Role;
  mustChangePassword?: boolean;
  themePreference?: Theme;
  betaBannerDismissed?: boolean;
}

export interface EmergencyContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  organizerIds: string[];
  organizerNames?: string[];
  travelerIds: string[];
  emergencyContacts?: EmergencyContact[];
}

export interface FinancialRecord {
  id: string;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
}

export interface PaymentTransaction {
  id: string;
  tripId: string;
  userId: string;
  provider: 'stripe' | 'paypal';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  providerReference: string;
  providerPaymentReference?: string;
  financialRecordId?: string;
  approvalUrl?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface Document {
  id: string;
  tripId: string;
  name: string;
  category: string;
  uploadDate: string;
  fileName: string;
  visibleTo: 'all' | string[];
  uploadedBy: string;
}

export interface PersonalDataFieldConfig {
  id: string;
  tripId: string;
  label: string;
  type: 'text' | 'date' | 'file' | 'radio' | 'multi';
  enabled?: boolean;
  locked?: boolean;
  order?: number;
  options?: string[];
  section?: string;
}

export interface PersonalDataRecord {
  userId: string;
  fieldId: string;
  value: string;
  isLocked: boolean;
}

export interface PersonalDataUpdatePayload {
  userId: string;
  fieldId: string;
  value: string;
  tripId?: string;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description: string;
  startDateTimeLocal: string;
  endDateTimeLocal?: string;
  location?: string;
  timeZone: string;
  programType?: 'required' | 'free' | 'optional';
}

export interface Message {
  id: string;
  tripId: string;
  authorId: string;
  recipientIds: string[];
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface SiteSettings {
  logoLight?: string;
  logoDark?: string;
  loginBackground?: string;
}
