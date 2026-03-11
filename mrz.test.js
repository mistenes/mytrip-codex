import { test } from 'node:test';
import assert from 'node:assert';
import { parseMrz } from './utils/mrz.js';

test('parseMrz reads passport fields', () => {
  const lines = [
    'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<',
    'L898902C36UTO7408122F1204159ZE184226B<<<<<10'
  ];
  const res = parseMrz(lines);
  assert.ok(res);
  assert.strictEqual(res.firstName, 'ANNA MARIA');
  assert.strictEqual(res.lastName, 'ERIKSSON');
  assert.strictEqual(res.issuingCountry, 'UTO');
  assert.strictEqual(res.passportNumber, 'L898902C3');
  assert.strictEqual(res.citizenship, 'UTO');
  assert.strictEqual(res.birthDate, '1974-08-12');
  assert.strictEqual(res.gender, 'Female');
  assert.strictEqual(res.expiryDate, '2012-04-15');
});
