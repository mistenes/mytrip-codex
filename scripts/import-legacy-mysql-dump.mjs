#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import User from '../server/models/User.js';
import Trip from '../server/models/Trip.js';
import FieldConfig from '../server/models/FieldConfig.js';
import ItineraryItem from '../server/models/ItineraryItem.js';
import FinancialRecord from '../server/models/FinancialRecord.js';
import Message from '../server/models/Message.js';
import Document from '../server/models/Document.js';
import { clearAppTables, closeDatabase, ensureSchema, listNonEmptyTables } from '../server/db/client.js';
import { uploadDir } from '../server/middleware/upload.js';
import { buildLegacyImportData } from './legacyMysqlImport.js';

function parseArgs(argv) {
    const args = {
        mode: 'dry-run',
        sqlPath: '',
        filesRoot: '',
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--apply') {
            args.mode = 'apply';
            continue;
        }
        if (arg === '--dry-run') {
            args.mode = 'dry-run';
            continue;
        }
        if (arg === '--sql') {
            args.sqlPath = argv[index + 1] || '';
            index += 1;
            continue;
        }
        if (arg === '--files-root') {
            args.filesRoot = argv[index + 1] || '';
            index += 1;
        }
    }

    if (!args.sqlPath) {
        throw new Error('Missing required --sql argument');
    }
    if (!args.filesRoot) {
        throw new Error('Missing required --files-root argument');
    }

    return args;
}

async function runDatabaseCheck(required) {
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL && !process.env.POSTGRES_URL) {
        if (required) {
            throw new Error('DATABASE_URL is required for --apply');
        }

        return {
            status: 'skipped',
            collections: [],
            reason: 'DATABASE_URL not set',
        };
    }

    try {
        await ensureSchema();
        const collections = await listNonEmptyTables();
        return {
            status: collections.length === 0 ? 'passed' : 'failed',
            collections,
            reason: collections.length === 0 ? '' : 'Target database is not empty',
        };
    } catch (error) {
        if (required) {
            throw error;
        }

        return {
            status: 'skipped',
            collections: [],
            reason: `Database check skipped: ${error.message}`,
        };
    }
}

async function applyImport(data, copyOperations) {
    const copiedFiles = [];

    try {
        await fs.mkdir(uploadDir, { recursive: true });

        for (const operation of copyOperations) {
            await fs.copyFile(operation.sourcePath, operation.destinationPath);
            copiedFiles.push(operation.destinationPath);
        }

        await FieldConfig.insertMany(data.fieldConfigs, { ordered: true });
        await User.insertMany(data.users, { ordered: true });
        await Trip.insertMany(data.trips, { ordered: true });
        await ItineraryItem.insertMany(data.itineraryItems, { ordered: true });
        await FinancialRecord.insertMany(data.financialRecords, { ordered: true });
        await Message.insertMany(data.messages, { ordered: true });
        await Document.insertMany(data.documents, { ordered: true });

        return copiedFiles;
    } catch (error) {
        await Promise.all(copiedFiles.map(async (filePath) => {
            try {
                await fs.unlink(filePath);
            } catch (_) {
            }
        }));

        await clearAppTables().catch(() => {});

        throw error;
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const sqlPath = path.resolve(args.sqlPath);
    const filesRoot = path.resolve(args.filesRoot);
    const sqlText = await fs.readFile(sqlPath, 'utf8');

    const importResult = await buildLegacyImportData({
        sqlText,
        filesRoot,
        uploadDir,
    });

    const databaseCheck = await runDatabaseCheck(args.mode === 'apply');
    importResult.report.databaseCheck = databaseCheck;

    if (databaseCheck.status === 'failed') {
        importResult.report.ok = false;
    }

    if (args.mode === 'apply') {
        if (!importResult.report.ok) {
            console.log(JSON.stringify(importResult.report, null, 2));
            process.exitCode = 1;
            return;
        }

        await applyImport(importResult.data, importResult.copyOperations);
        importResult.report.insertedCounts = { ...importResult.report.preparedCounts };
    }

    console.log(JSON.stringify(importResult.report, null, 2));
    process.exitCode = importResult.report.ok ? 0 : 1;
}

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.stack || error.message : error);
        process.exit(1);
    })
    .finally(async () => {
        await closeDatabase().catch(() => {});
    });
