import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getDefaultFieldConfigs } from '../server/utils/defaultFieldConfigs.js';

const LEGACY_TABLES = [
    'users',
    'trips',
    'user_trips',
    'form_fields',
    'user_forms',
    'events',
    'messages',
    'message_status',
    'trip_financials',
    'user_trip_documents',
];

const IGNORED_TABLES = ['auth_tokens', 'calendars'];

const LEGACY_FIELD_NAME_MAP = new Map([
    ['First Name', 'firstName'],
    ['Last Name', 'lastName'],
    ['Middle Name', 'middleName'],
    ['Passport Number', 'passportNumber'],
    ['Issue Date', 'issueDate'],
    ['Issuing Country', 'issuingCountry'],
    ['Expiry Date', 'expiryDate'],
    ['Nationality', 'nationality'],
    ['Sex', 'sex'],
]);

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeEscapedChar(char) {
    switch (char) {
        case '0':
            return '\0';
        case 'n':
            return '\n';
        case 'r':
            return '\r';
        case 't':
            return '\t';
        default:
            return char;
    }
}

function parseUnquotedValue(token) {
    const trimmed = token.trim();
    if (trimmed === '') {
        return '';
    }
    if (/^null$/i.test(trimmed)) {
        return null;
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return trimmed;
}

function parseValuesClause(valuesClause) {
    const rows = [];
    let row = null;
    let token = '';
    let stringValue = '';
    let inString = false;
    let escapeNext = false;
    let quoted = false;

    function pushValue() {
        if (!row) {
            return;
        }

        row.push(quoted ? stringValue : parseUnquotedValue(token));
        token = '';
        stringValue = '';
        quoted = false;
    }

    for (let index = 0; index < valuesClause.length; index += 1) {
        const char = valuesClause[index];

        if (inString) {
            if (escapeNext) {
                stringValue += decodeEscapedChar(char);
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === "'" && valuesClause[index + 1] === "'") {
                stringValue += "'";
                index += 1;
                continue;
            }

            if (char === "'") {
                inString = false;
                continue;
            }

            stringValue += char;
            continue;
        }

        if (char === "'") {
            inString = true;
            quoted = true;
            continue;
        }

        if (char === '(') {
            row = [];
            token = '';
            stringValue = '';
            quoted = false;
            continue;
        }

        if (!row) {
            continue;
        }

        if (char === ',') {
            pushValue();
            continue;
        }

        if (char === ')') {
            pushValue();
            rows.push(row);
            row = null;
            continue;
        }

        token += char;
    }

    return rows;
}

function extractInsertStatements(sqlText, table) {
    const statements = [];
    const needle = `INSERT INTO \`${table}\` `;
    let searchFrom = 0;

    while (searchFrom < sqlText.length) {
        const start = sqlText.indexOf(needle, searchFrom);
        if (start === -1) {
            break;
        }

        let inString = false;
        let escapeNext = false;
        let end = start;

        for (; end < sqlText.length; end += 1) {
            const char = sqlText[end];

            if (inString) {
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === "'" && sqlText[end + 1] === "'") {
                    end += 1;
                    continue;
                }

                if (char === "'") {
                    inString = false;
                }
                continue;
            }

            if (char === "'") {
                inString = true;
                continue;
            }

            if (char === ';') {
                statements.push(sqlText.slice(start, end + 1));
                searchFrom = end + 1;
                break;
            }
        }

        if (end >= sqlText.length) {
            throw new Error(`Unterminated INSERT statement for table ${table}`);
        }
    }

    return statements;
}

function parseInsertStatement(statement, table) {
    const pattern = new RegExp(
        '^INSERT INTO `' + escapeRegExp(table) + '`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*);$',
        'm'
    );
    const match = statement.match(pattern);
    if (!match) {
        throw new Error(`Unable to parse INSERT statement for table ${table}`);
    }

    const columns = [...match[1].matchAll(/`([^`]+)`/g)].map((result) => result[1]);
    const rows = parseValuesClause(match[2]);

    return rows.map((values) => {
        if (values.length !== columns.length) {
            throw new Error(`Column/value count mismatch for table ${table}`);
        }

        const row = {};
        columns.forEach((column, index) => {
            row[column] = values[index];
        });
        return row;
    });
}

export function parseLegacyMysqlDump(sqlText) {
    const tables = Object.fromEntries(LEGACY_TABLES.map((table) => [table, []]));

    for (const table of LEGACY_TABLES) {
        const statements = extractInsertStatements(sqlText, table);
        for (const statement of statements) {
            tables[table].push(...parseInsertStatement(statement, table));
        }
    }

    return tables;
}

export function normalizeLegacyTripId(value) {
    return String(value || '').trim().toUpperCase();
}

export function normalizeLegacyBcryptHash(value) {
    const raw = String(value || '');
    return raw.startsWith('$2y$') ? `$2b$${raw.slice(4)}` : raw;
}

function normalizeDate(value) {
    return value ? String(value).slice(0, 10) : '';
}

function normalizeDateTimeLocal(value) {
    return value ? String(value).replace(' ', 'T').slice(0, 16) : '';
}

function parseTimestamp(value) {
    if (!value) {
        return undefined;
    }

    const normalized = String(value).replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return new Date(`${normalized}T00:00:00Z`);
    }

    return new Date(`${normalized}Z`);
}

function slugifyFieldName(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'legacy-field';
}

function normalizeFieldType(value) {
    const raw = String(value || 'text').trim().toLowerCase();
    return ['text', 'date', 'file', 'radio', 'multi'].includes(raw) ? raw : 'text';
}

function defaultUploadFilename({ originalFilename }) {
    return `${crypto.randomBytes(16).toString('hex')}${path.extname(originalFilename || '')}`;
}

function createId() {
    return crypto.randomUUID();
}

async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);
        return true;
    } catch (_) {
        return false;
    }
}

async function resolveLegacyFilePath(filesRoot, legacyPath) {
    const normalizedLegacyPath = String(legacyPath || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const candidates = [path.resolve(filesRoot, normalizedLegacyPath)];

    if (normalizedLegacyPath.startsWith('user_files/')) {
        candidates.push(path.resolve(filesRoot, normalizedLegacyPath.slice('user_files/'.length)));
    }

    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    return null;
}

async function createUniqueUploadFilename({
    createUploadFilename,
    uploadDir,
    originalFilename,
    sourcePath,
    legacyDocument,
    usedFilenames,
}) {
    const requestedFilename = String(createUploadFilename({
        originalFilename,
        sourcePath,
        legacyDocument,
    }) || '').trim();

    const fallbackFilename = defaultUploadFilename({ originalFilename });
    const initialFilename = requestedFilename || fallbackFilename;
    const parsedPath = path.parse(initialFilename);
    const basename = parsedPath.name || 'legacy-upload';
    const extension = parsedPath.ext || path.extname(originalFilename || '');

    let attempt = 0;
    while (attempt < 1000) {
        const candidate = attempt === 0
            ? `${basename}${extension}`
            : `${basename}-${attempt}${extension}`;

        const destinationPath = path.join(uploadDir, candidate);
        if (!usedFilenames.has(candidate) && !(await pathExists(destinationPath))) {
            usedFilenames.add(candidate);
            return candidate;
        }

        attempt += 1;
    }

    throw new Error(`Unable to generate a unique upload filename for ${originalFilename}`);
}

function createReport(tables) {
    return {
        ok: true,
        sourceCounts: {
            users: tables.users.length,
            trips: tables.trips.length,
            tripAssignments: tables.user_trips.length,
            legacyFormFields: tables.form_fields.length,
            legacyFormEntries: tables.user_forms.length,
            itineraryItems: tables.events.length,
            financialRecords: tables.trip_financials.length,
            messages: tables.messages.length,
            messageStatuses: tables.message_status.length,
            documents: tables.user_trip_documents.length,
        },
        preparedCounts: {},
        insertedCounts: {},
        ignoredTables: [...IGNORED_TABLES],
        conflicts: {
            personalData: [],
        },
        errors: {
            missingAdmins: [],
            unresolvedTrips: [],
            unresolvedUsers: [],
            unresolvedFields: [],
            missingFiles: [],
        },
        warnings: [],
        databaseCheck: {
            status: 'not-run',
            collections: [],
        },
    };
}

function sortPersonalData(entries, orderLookup) {
    return [...entries].sort((left, right) => {
        const leftOrder = orderLookup.get(left.field) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = orderLookup.get(right.field) ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }
        return left.field.localeCompare(right.field);
    });
}

export async function buildLegacyImportData({
    sqlText,
    filesRoot,
    uploadDir,
    createUploadFilename = defaultUploadFilename,
}) {
    const tables = typeof sqlText === 'string' ? parseLegacyMysqlDump(sqlText) : sqlText;
    const report = createReport(tables);

    if (!filesRoot) {
        throw new Error('filesRoot is required');
    }

    const userDocs = [];
    const userByLegacyId = new Map();

    for (const legacyUser of tables.users) {
        const userDoc = {
            _id: createId(),
            username: String(legacyUser.username || '').trim(),
            passwordHash: normalizeLegacyBcryptHash(legacyUser.password),
            role: legacyUser.role === 'admin' ? 'admin' : 'traveler',
            email: String(legacyUser.email || '').trim().toLowerCase(),
            firstName: '',
            lastName: '',
            name: String(legacyUser.username || '').trim(),
            personalData: [],
            mustChangePassword: false,
        };

        userDocs.push(userDoc);
        userByLegacyId.set(Number(legacyUser.id), userDoc);
    }

    const adminUsers = userDocs.filter((user) => user.role === 'admin');
    if (adminUsers.length === 0) {
        report.errors.missingAdmins.push({ message: 'No admin user found in legacy dump' });
    }

    const tripDocs = [];
    const tripByNormalizedId = new Map();
    const tripByNumericId = new Map();

    for (const legacyTrip of tables.trips) {
        const normalizedTripId = normalizeLegacyTripId(legacyTrip.trip_id);
        const tripDoc = {
            _id: createId(),
            name: String(legacyTrip.name || '').trim(),
            startDate: normalizeDate(legacyTrip.start_date),
            endDate: normalizeDate(legacyTrip.end_date),
            organizerIds: adminUsers.map((user) => user._id),
            travelerIds: [],
        };

        tripDocs.push(tripDoc);
        tripByNormalizedId.set(normalizedTripId, tripDoc);
        tripByNumericId.set(Number(legacyTrip.id), tripDoc);
    }

    for (const assignment of tables.user_trips) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(assignment.trip_id));
        const user = userByLegacyId.get(Number(assignment.user_id));

        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'user_trips', rowId: Number(assignment.id), tripId: assignment.trip_id });
            continue;
        }
        if (!user) {
            report.errors.unresolvedUsers.push({ table: 'user_trips', rowId: Number(assignment.id), userId: Number(assignment.user_id) });
            continue;
        }

        if (!trip.travelerIds.some((id) => String(id) === String(user._id))) {
            trip.travelerIds.push(user._id);
        }
    }

    const defaultFieldConfigs = getDefaultFieldConfigs().map((config) => ({
        _id: createId(),
        ...config,
        tripId: 'default',
    }));

    const defaultFieldConfigByField = new Map(defaultFieldConfigs.map((config) => [config.field, config]));
    const fieldConfigByKey = new Map(defaultFieldConfigs.map((config) => [`${config.field}:default`, config]));
    const fieldTargetByLegacyId = new Map();
    const extraFieldConfigs = [];

    for (const legacyField of tables.form_fields) {
        const mappedField = LEGACY_FIELD_NAME_MAP.get(String(legacyField.field_name || '').trim()) || slugifyFieldName(legacyField.field_name);
        let targetTripId = 'default';

        if (Number(legacyField.trip_id) !== 0) {
            const trip = tripByNumericId.get(Number(legacyField.trip_id));
            if (!trip) {
                report.errors.unresolvedTrips.push({ table: 'form_fields', rowId: Number(legacyField.id), tripId: Number(legacyField.trip_id) });
                continue;
            }
            targetTripId = String(trip._id);
        }

        const key = `${mappedField}:${targetTripId}`;
        let config = fieldConfigByKey.get(key);

        if (!config) {
            const defaultConfig = defaultFieldConfigByField.get(mappedField);
            config = {
                _id: createId(),
                field: mappedField,
                tripId: targetTripId,
                label: defaultConfig?.label || String(legacyField.field_name || '').trim(),
                type: defaultConfig?.type || normalizeFieldType(legacyField.field_type),
                enabled: true,
                locked: defaultConfig?.locked ?? false,
                order: Number(legacyField.order || 0),
                options: [],
                section: defaultConfig?.section || 'general',
            };

            extraFieldConfigs.push(config);
            fieldConfigByKey.set(key, config);
        }

        fieldTargetByLegacyId.set(Number(legacyField.id), {
            field: mappedField,
            tripId: targetTripId,
        });
    }

    const personalDataByUserId = new Map(userDocs.map((user) => [String(user._id), new Map()]));

    const sortedUserForms = [...tables.user_forms].sort((left, right) => {
        const leftTs = parseTimestamp(left.submitted_at)?.getTime() || 0;
        const rightTs = parseTimestamp(right.submitted_at)?.getTime() || 0;
        if (leftTs !== rightTs) {
            return leftTs - rightTs;
        }
        return Number(left.id) - Number(right.id);
    });

    for (const legacyValue of sortedUserForms) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(legacyValue.trip_id));
        const user = userByLegacyId.get(Number(legacyValue.user_id));
        const targetField = fieldTargetByLegacyId.get(Number(legacyValue.field_id));

        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'user_forms', rowId: Number(legacyValue.id), tripId: legacyValue.trip_id });
            continue;
        }
        if (!user) {
            report.errors.unresolvedUsers.push({ table: 'user_forms', rowId: Number(legacyValue.id), userId: Number(legacyValue.user_id) });
            continue;
        }
        if (!targetField) {
            report.errors.unresolvedFields.push({ table: 'user_forms', rowId: Number(legacyValue.id), fieldId: Number(legacyValue.field_id) });
            continue;
        }

        const userFieldMap = personalDataByUserId.get(String(user._id));
        const value = String(legacyValue.value || '').trim();
        const existing = userFieldMap.get(targetField.field);

        if (existing && existing.value && value && existing.value !== value) {
            report.conflicts.personalData.push({
                legacyUserId: Number(legacyValue.user_id),
                field: targetField.field,
                previousValue: existing.value,
                nextValue: value,
                submittedAt: legacyValue.submitted_at,
            });
        }

        if (!existing || (!existing.value && value) || value) {
            userFieldMap.set(targetField.field, {
                field: targetField.field,
                value: value || existing?.value || '',
                locked: false,
            });
        }
    }

    const orderLookup = new Map(getDefaultFieldConfigs().map((config) => [config.field, config.order]));
    extraFieldConfigs.forEach((config) => {
        orderLookup.set(config.field, config.order);
    });

    for (const user of userDocs) {
        const entries = [...personalDataByUserId.get(String(user._id)).values()];
        user.personalData = sortPersonalData(entries, orderLookup);
        user.firstName = user.personalData.find((entry) => entry.field === 'firstName')?.value || '';
        user.lastName = user.personalData.find((entry) => entry.field === 'lastName')?.value || '';
        user.name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username;
    }

    const itineraryItems = [];
    for (const legacyEvent of tables.events) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(legacyEvent.trip_id));
        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'events', rowId: Number(legacyEvent.id), tripId: legacyEvent.trip_id });
            continue;
        }

        const createdAt = parseTimestamp(legacyEvent.created_at);
        itineraryItems.push({
            _id: createId(),
            tripId: trip._id,
            title: String(legacyEvent.title || '').trim(),
            description: String(legacyEvent.remark || '').trim(),
            startDateTimeLocal: normalizeDateTimeLocal(legacyEvent.start_datetime),
            endDateTimeLocal: normalizeDateTimeLocal(legacyEvent.end_datetime),
            location: String(legacyEvent.location || '').trim(),
            timeZone: String(legacyEvent.start_timezone || '').trim(),
            programType: 'required',
            createdAt,
            updatedAt: createdAt,
        });
    }

    const financialRecords = [];
    for (const legacyRecord of tables.trip_financials) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(legacyRecord.trip_id));
        const user = userByLegacyId.get(Number(legacyRecord.user_id));

        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'trip_financials', rowId: Number(legacyRecord.id), tripId: legacyRecord.trip_id });
            continue;
        }
        if (!user) {
            report.errors.unresolvedUsers.push({ table: 'trip_financials', rowId: Number(legacyRecord.id), userId: Number(legacyRecord.user_id) });
            continue;
        }

        const rawAmount = Number(legacyRecord.amount || 0);
        const signedAmount = String(legacyRecord.type || '').trim().toLowerCase() === 'expense'
            ? -Math.abs(rawAmount)
            : Math.abs(rawAmount);

        financialRecords.push({
            _id: createId(),
            tripId: trip._id,
            userId: user._id,
            description: String(legacyRecord.description || '').trim(),
            amount: signedAmount,
            date: normalizeDate(legacyRecord.date),
        });
    }

    const messageStatusByMessageId = new Map();
    for (const status of tables.message_status) {
        const entries = messageStatusByMessageId.get(Number(status.message_id)) || [];
        entries.push(status);
        messageStatusByMessageId.set(Number(status.message_id), entries);
    }

    const defaultAuthorId = adminUsers[0]?._id;
    const messages = [];

    for (const legacyMessage of tables.messages) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(legacyMessage.trip_id));
        const recipient = userByLegacyId.get(Number(legacyMessage.user_id));

        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'messages', rowId: Number(legacyMessage.id), tripId: legacyMessage.trip_id });
            continue;
        }
        if (!recipient) {
            report.errors.unresolvedUsers.push({ table: 'messages', rowId: Number(legacyMessage.id), userId: Number(legacyMessage.user_id) });
            continue;
        }
        if (!defaultAuthorId) {
            continue;
        }

        const contentParts = [String(legacyMessage.title || '').trim(), String(legacyMessage.body || '').trim()].filter(Boolean);
        const readBy = [defaultAuthorId];
        const statuses = messageStatusByMessageId.get(Number(legacyMessage.id)) || [];
        const recipientRead = statuses.some((status) => Number(status.user_id) === Number(legacyMessage.user_id) && Number(status.is_read) === 1);
        if (recipientRead) {
            readBy.push(recipient._id);
        }

        const createdAt = parseTimestamp(legacyMessage.created_at);
        messages.push({
            _id: createId(),
            tripId: trip._id,
            authorId: defaultAuthorId,
            recipientIds: [recipient._id],
            content: contentParts.join('\n\n'),
            readBy,
            createdAt,
            updatedAt: createdAt,
        });
    }

    const documents = [];
    const copyOperations = [];
    const usedUploadFilenames = new Set();

    for (const legacyDocument of tables.user_trip_documents) {
        const trip = tripByNormalizedId.get(normalizeLegacyTripId(legacyDocument.trip_id));
        const user = userByLegacyId.get(Number(legacyDocument.user_id));

        if (!trip) {
            report.errors.unresolvedTrips.push({ table: 'user_trip_documents', rowId: Number(legacyDocument.id), tripId: legacyDocument.trip_id });
            continue;
        }
        if (!user) {
            report.errors.unresolvedUsers.push({ table: 'user_trip_documents', rowId: Number(legacyDocument.id), userId: Number(legacyDocument.user_id) });
            continue;
        }

        const sourcePath = await resolveLegacyFilePath(filesRoot, legacyDocument.filepath);
        if (!sourcePath) {
            report.errors.missingFiles.push({
                table: 'user_trip_documents',
                rowId: Number(legacyDocument.id),
                filepath: legacyDocument.filepath,
            });
            continue;
        }

        const generatedFilename = await createUniqueUploadFilename({
            createUploadFilename,
            uploadDir,
            originalFilename: String(legacyDocument.filename || '').trim(),
            sourcePath,
            legacyDocument,
            usedFilenames: usedUploadFilenames,
        });

        const createdAt = parseTimestamp(legacyDocument.upload_date);
        documents.push({
            _id: createId(),
            tripId: trip._id,
            userId: user._id,
            name: String(legacyDocument.filename || '').trim(),
            category: String(legacyDocument.category || '').trim() || 'General',
            filename: generatedFilename,
            uploadDate: normalizeDate(legacyDocument.upload_date),
            visibleTo: [String(user._id)],
            createdAt,
            updatedAt: createdAt,
        });

        copyOperations.push({
            sourcePath,
            destinationPath: path.join(uploadDir, generatedFilename),
        });
    }

    report.preparedCounts = {
        users: userDocs.length,
        trips: tripDocs.length,
        fieldConfigs: defaultFieldConfigs.length + extraFieldConfigs.length,
        personalDataEntries: userDocs.reduce((sum, user) => sum + user.personalData.length, 0),
        itineraryItems: itineraryItems.length,
        financialRecords: financialRecords.length,
        messages: messages.length,
        documents: documents.length,
        fileCopies: copyOperations.length,
    };

    const errorCount = Object.values(report.errors).reduce((sum, entries) => sum + entries.length, 0);
    report.ok = errorCount === 0;

    return {
        report,
        data: {
            users: userDocs,
            trips: tripDocs,
            fieldConfigs: [...defaultFieldConfigs, ...extraFieldConfigs],
            itineraryItems,
            financialRecords,
            messages,
            documents,
        },
        copyOperations,
    };
}
