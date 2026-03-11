import assert from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import bcrypt from 'bcryptjs';

import {
  buildLegacyImportData,
  normalizeLegacyBcryptHash,
  normalizeLegacyTripId,
  parseLegacyMysqlDump,
} from './scripts/legacyMysqlImport.js';

async function createTempImportRoots() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'mytrip-legacy-import-'));
  const filesRoot = path.join(tempRoot, 'legacy-files');
  const uploadRoot = path.join(tempRoot, 'uploads');
  await fs.mkdir(filesRoot, { recursive: true });
  await fs.mkdir(uploadRoot, { recursive: true });
  return { tempRoot, filesRoot, uploadRoot };
}

test('legacy MySQL import parser and mapper prepare Mongo-compatible data', async () => {
  const { filesRoot, uploadRoot } = await createTempImportRoots();
  const sourceDir = path.join(filesRoot, 'user_files', 'traveler');
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'ticket.pdf'), 'fixture');

  const passwordHash = await bcrypt.hash('hunter2', 4);
  const legacyPasswordHash = passwordHash.replace(/^\$2[ab]\$/, '$2y$');

  const sql = `
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`, \`email\`, \`token\`, \`is_active\`) VALUES
(1, 'adminuser', '${legacyPasswordHash}', 'admin', 'admin@example.com', NULL, 1),
(2, 'traveleruser', '${legacyPasswordHash}', 'user', 'traveler@example.com', NULL, 1);

INSERT INTO \`trips\` (\`id\`, \`trip_id\`, \`name\`, \`start_date\`, \`end_date\`) VALUES
(10, 'trip1', 'Demo Trip', '2026-01-01', '2026-01-10');

INSERT INTO \`user_trips\` (\`id\`, \`user_id\`, \`trip_id\`, \`subscription_token\`, \`assigned_date\`) VALUES
(1, 2, 'TRIP1', NULL, '2025-01-01 12:00:00');

INSERT INTO \`form_fields\` (\`id\`, \`field_name\`, \`field_type\`, \`is_required\`, \`order\`, \`trip_id\`) VALUES
(1, 'First Name', 'text', 0, 1, 0),
(2, 'Passport Number', 'text', 0, 2, 0);

INSERT INTO \`user_forms\` (\`id\`, \`trip_id\`, \`user_id\`, \`field_id\`, \`value\`, \`submitted_at\`) VALUES
(1, 'TRIP1', 2, 1, 'Alice', '2025-01-01 10:00:00'),
(2, 'TRIP1', 2, 1, 'Alicia', '2025-01-02 10:00:00'),
(3, 'TRIP1', 2, 2, 'P123456', '2025-01-01 11:00:00');

INSERT INTO \`events\` (\`id\`, \`trip_id\`, \`title\`, \`start_datetime\`, \`end_datetime\`, \`start_timezone\`, \`end_timezone\`, \`location\`, \`remark\`, \`created_at\`) VALUES
(1, 'TRIP1', 'Flight', '2026-01-02 06:00:00', '2026-01-02 08:00:00', 'Europe/Budapest', 'Europe/Budapest', 'Airport', 'Gate 1', '2025-01-03 09:00:00');

INSERT INTO \`trip_financials\` (\`id\`, \`trip_id\`, \`user_id\`, \`description\`, \`amount\`, \`type\`, \`date\`) VALUES
(1, 'TRIP1', 2, 'Deposit', 1000, 'expense', '2025-01-04'),
(2, 'TRIP1', 2, 'Refund', 2000, 'income', '2025-01-05');

INSERT INTO \`messages\` (\`id\`, \`trip_id\`, \`user_id\`, \`title\`, \`body\`, \`created_at\`) VALUES
(1, 'TRIP1', 2, 'Hello', 'Legacy body', '2025-01-06 12:00:00');

INSERT INTO \`message_status\` (\`id\`, \`message_id\`, \`user_id\`, \`is_read\`, \`read_at\`) VALUES
(1, 1, 2, 1, '2025-01-06 12:30:00');

INSERT INTO \`user_trip_documents\` (\`id\`, \`trip_id\`, \`user_id\`, \`filename\`, \`filepath\`, \`upload_date\`, \`category\`) VALUES
(1, 'TRIP1', 2, 'ticket.pdf', 'user_files/traveler/ticket.pdf', '2025-01-07 08:00:00', 'Tickets');
`;

  const parsed = parseLegacyMysqlDump(sql);
  assert.strictEqual(parsed.users.length, 2);
  assert.strictEqual(parsed.trips.length, 1);
  assert.strictEqual(normalizeLegacyTripId('trip1'), 'TRIP1');
  assert.strictEqual(normalizeLegacyBcryptHash('$2y$10$abc'), '$2b$10$abc');

  let filenameCounter = 0;
  const importResult = await buildLegacyImportData({
    sqlText: sql,
    filesRoot,
    uploadDir: uploadRoot,
    createUploadFilename: ({ originalFilename }) => {
      filenameCounter += 1;
      return `legacy-${filenameCounter}${path.extname(originalFilename)}`;
    },
  });

  assert.strictEqual(importResult.report.ok, true);
  assert.strictEqual(importResult.report.sourceCounts.users, 2);
  assert.strictEqual(importResult.report.sourceCounts.trips, 1);
  assert.strictEqual(importResult.report.sourceCounts.tripAssignments, 1);
  assert.strictEqual(importResult.report.sourceCounts.documents, 1);
  assert.strictEqual(importResult.report.conflicts.personalData.length, 1);

  assert.strictEqual(importResult.data.fieldConfigs.some((config) => config.field === 'middleName'), true);
  assert.strictEqual(importResult.data.users.length, 2);
  assert.strictEqual(importResult.data.users[0].passwordHash.startsWith('$2b$'), true);

  const traveler = importResult.data.users.find((user) => user.username === 'traveleruser');
  assert.ok(traveler);
  assert.strictEqual(traveler.firstName, 'Alicia');
  assert.strictEqual(traveler.name, 'Alicia');
  assert.strictEqual(traveler.personalData.find((entry) => entry.field === 'passportNumber')?.value, 'P123456');
  assert.strictEqual(await bcrypt.compare('hunter2', traveler.passwordHash), true);

  assert.strictEqual(importResult.data.trips.length, 1);
  assert.strictEqual(importResult.data.trips[0].organizerIds.length, 1);
  assert.strictEqual(importResult.data.trips[0].travelerIds.length, 1);

  assert.deepStrictEqual(
    importResult.data.financialRecords.map((record) => record.amount).sort((left, right) => left - right),
    [-1000, 2000]
  );

  assert.strictEqual(importResult.data.messages.length, 1);
  assert.strictEqual(importResult.data.messages[0].content, 'Hello\n\nLegacy body');
  assert.strictEqual(importResult.data.messages[0].readBy.length, 2);

  assert.strictEqual(importResult.data.documents.length, 1);
  assert.strictEqual(importResult.data.documents[0].visibleTo.length, 1);
  assert.strictEqual(importResult.copyOperations.length, 1);
  assert.strictEqual(path.basename(importResult.copyOperations[0].destinationPath), 'legacy-1.pdf');
});

test('legacy import report flags missing files and unresolved references before apply', async () => {
  const { filesRoot, uploadRoot } = await createTempImportRoots();
  await fs.mkdir(path.join(filesRoot, 'user_files'), { recursive: true });

  const sql = `
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`, \`email\`, \`token\`, \`is_active\`) VALUES
(1, 'adminuser', '$2y$10$abcdefghijklmnopqrstuv', 'admin', 'admin@example.com', NULL, 1);

INSERT INTO \`trips\` (\`id\`, \`trip_id\`, \`name\`, \`start_date\`, \`end_date\`) VALUES
(10, 'TRIP1', 'Demo Trip', '2026-01-01', '2026-01-10');

INSERT INTO \`user_trips\` (\`id\`, \`user_id\`, \`trip_id\`, \`subscription_token\`, \`assigned_date\`) VALUES
(1, 99, 'TRIP1', NULL, '2025-01-01 12:00:00');

INSERT INTO \`form_fields\` (\`id\`, \`field_name\`, \`field_type\`, \`is_required\`, \`order\`, \`trip_id\`) VALUES
(1, 'First Name', 'text', 0, 1, 0);

INSERT INTO \`user_forms\` (\`id\`, \`trip_id\`, \`user_id\`, \`field_id\`, \`value\`, \`submitted_at\`) VALUES
(1, 'UNKNOWN', 1, 1, 'Admin', '2025-01-01 10:00:00');

INSERT INTO \`events\` (\`id\`, \`trip_id\`, \`title\`, \`start_datetime\`, \`end_datetime\`, \`start_timezone\`, \`end_timezone\`, \`location\`, \`remark\`, \`created_at\`) VALUES
(1, 'TRIP1', 'Flight', '2026-01-02 06:00:00', '2026-01-02 08:00:00', 'Europe/Budapest', 'Europe/Budapest', 'Airport', 'Gate 1', '2025-01-03 09:00:00');

INSERT INTO \`trip_financials\` (\`id\`, \`trip_id\`, \`user_id\`, \`description\`, \`amount\`, \`type\`, \`date\`) VALUES
(1, 'TRIP1', 1, 'Deposit', 1000, 'income', '2025-01-04');

INSERT INTO \`messages\` (\`id\`, \`trip_id\`, \`user_id\`, \`title\`, \`body\`, \`created_at\`) VALUES
(1, 'TRIP1', 1, 'Hello', 'Legacy body', '2025-01-06 12:00:00');

INSERT INTO \`message_status\` (\`id\`, \`message_id\`, \`user_id\`, \`is_read\`, \`read_at\`) VALUES
(1, 1, 1, 1, '2025-01-06 12:30:00');

INSERT INTO \`user_trip_documents\` (\`id\`, \`trip_id\`, \`user_id\`, \`filename\`, \`filepath\`, \`upload_date\`, \`category\`) VALUES
(1, 'TRIP1', 1, 'missing.pdf', 'user_files/traveler/missing.pdf', '2025-01-07 08:00:00', 'Tickets');
`;

  const importResult = await buildLegacyImportData({
    sqlText: sql,
    filesRoot,
    uploadDir: uploadRoot,
  });

  assert.strictEqual(importResult.report.ok, false);
  assert.strictEqual(importResult.report.errors.unresolvedUsers.length, 1);
  assert.strictEqual(importResult.report.errors.unresolvedTrips.length, 1);
  assert.strictEqual(importResult.report.errors.missingFiles.length, 1);
  assert.strictEqual(importResult.data.documents.length, 0);
  assert.strictEqual(importResult.copyOperations.length, 0);
});

test('legacy document import resolves filename collisions without overwriting uploads', async () => {
  const { filesRoot, uploadRoot } = await createTempImportRoots();
  const sourceDir = path.join(filesRoot, 'user_files', 'traveler');
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'ticket-a.pdf'), 'fixture-a');
  await fs.writeFile(path.join(sourceDir, 'ticket-b.pdf'), 'fixture-b');
  await fs.writeFile(path.join(uploadRoot, 'fixed-name.pdf'), 'existing-upload');

  const sql = `
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`, \`email\`, \`token\`, \`is_active\`) VALUES
(1, 'adminuser', '$2y$10$abcdefghijklmnopqrstuv', 'admin', 'admin@example.com', NULL, 1),
(2, 'traveleruser', '$2y$10$abcdefghijklmnopqrstuv', 'user', 'traveler@example.com', NULL, 1);

INSERT INTO \`trips\` (\`id\`, \`trip_id\`, \`name\`, \`start_date\`, \`end_date\`) VALUES
(10, 'TRIP1', 'Demo Trip', '2026-01-01', '2026-01-10');

INSERT INTO \`user_trips\` (\`id\`, \`user_id\`, \`trip_id\`, \`subscription_token\`, \`assigned_date\`) VALUES
(1, 2, 'TRIP1', NULL, '2025-01-01 12:00:00');

INSERT INTO \`form_fields\` (\`id\`, \`field_name\`, \`field_type\`, \`is_required\`, \`order\`, \`trip_id\`) VALUES
(1, 'First Name', 'text', 0, 1, 0);

INSERT INTO \`user_forms\` (\`id\`, \`trip_id\`, \`user_id\`, \`field_id\`, \`value\`, \`submitted_at\`) VALUES
(1, 'TRIP1', 2, 1, 'Traveler', '2025-01-01 10:00:00');

INSERT INTO \`events\` (\`id\`, \`trip_id\`, \`title\`, \`start_datetime\`, \`end_datetime\`, \`start_timezone\`, \`end_timezone\`, \`location\`, \`remark\`, \`created_at\`) VALUES
(1, 'TRIP1', 'Flight', '2026-01-02 06:00:00', '2026-01-02 08:00:00', 'Europe/Budapest', 'Europe/Budapest', 'Airport', 'Gate 1', '2025-01-03 09:00:00');

INSERT INTO \`trip_financials\` (\`id\`, \`trip_id\`, \`user_id\`, \`description\`, \`amount\`, \`type\`, \`date\`) VALUES
(1, 'TRIP1', 2, 'Deposit', 1000, 'income', '2025-01-04');

INSERT INTO \`messages\` (\`id\`, \`trip_id\`, \`user_id\`, \`title\`, \`body\`, \`created_at\`) VALUES
(1, 'TRIP1', 2, 'Hello', 'Legacy body', '2025-01-06 12:00:00');

INSERT INTO \`message_status\` (\`id\`, \`message_id\`, \`user_id\`, \`is_read\`, \`read_at\`) VALUES
(1, 1, 2, 1, '2025-01-06 12:30:00');

INSERT INTO \`user_trip_documents\` (\`id\`, \`trip_id\`, \`user_id\`, \`filename\`, \`filepath\`, \`upload_date\`, \`category\`) VALUES
(1, 'TRIP1', 2, 'ticket-a.pdf', 'user_files/traveler/ticket-a.pdf', '2025-01-07 08:00:00', 'Tickets'),
(2, 'TRIP1', 2, 'ticket-b.pdf', 'user_files/traveler/ticket-b.pdf', '2025-01-07 09:00:00', 'Tickets');
`;

  const importResult = await buildLegacyImportData({
    sqlText: sql,
    filesRoot,
    uploadDir: uploadRoot,
    createUploadFilename: () => 'fixed-name.pdf',
  });

  assert.strictEqual(importResult.report.ok, true);
  assert.strictEqual(importResult.copyOperations.length, 2);
  assert.deepStrictEqual(
    importResult.copyOperations.map((operation) => path.basename(operation.destinationPath)).sort(),
    ['fixed-name-1.pdf', 'fixed-name-2.pdf']
  );
});
