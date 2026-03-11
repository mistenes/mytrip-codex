/**
 * @typedef {Object} MrzResult
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} issuingCountry
 * @property {string} passportNumber
 * @property {string} citizenship
 * @property {string} birthDate
 * @property {string} gender
 * @property {string} expiryDate
 */

function formatDate(yyMMdd) {
  if (yyMMdd.length !== 6) return '';
  const year = parseInt(yyMMdd.slice(0, 2), 10);
  const month = yyMMdd.slice(2, 4);
  const day = yyMMdd.slice(4, 6);
  const currentYear = new Date().getFullYear() % 100;
  const century = year > currentYear ? 1900 : 2000;
  return `${century + year}-${month}-${day}`;
}

/**
 * Parse two-line MRZ data.
 * @param {string[]} lines
 * @returns {MrzResult|null}
 */
export function parseMrz(lines) {
  if (lines.length < 2) return null;
  const line1 = lines[0].padEnd(44, '<');
  const line2 = lines[1].padEnd(44, '<');
  const issuingCountry = line1.slice(2, 5).replace(/</g, '');
  const names = line1.slice(5).split('<<');
  const lastName = names[0].replace(/</g, ' ').trim();
  const firstName = (names[1] || '').replace(/</g, ' ').trim();

  const passportNumber = line2.slice(0, 9).replace(/</g, '');
  const citizenship = line2.slice(10, 13).replace(/</g, '');
  const birthDate = formatDate(line2.slice(13, 19));
  const genderCode = line2.charAt(20);
  const gender = genderCode === 'M' ? 'Male' : genderCode === 'F' ? 'Female' : 'Unspecified';
  const expiryDate = formatDate(line2.slice(21, 27));

  return {
    firstName,
    lastName,
    issuingCountry,
    passportNumber,
    citizenship,
    birthDate,
    gender,
    expiryDate
  };
}
