export interface MrzResult {
  firstName: string;
  lastName: string;
  issuingCountry: string;
  passportNumber: string;
  citizenship: string;
  birthDate: string;
  gender: string;
  expiryDate: string;
}
export function parseMrz(lines: string[]): MrzResult | null;
