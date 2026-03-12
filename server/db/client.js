import { Pool } from 'pg';

const APP_TABLES = [
  'site_settings',
  'payment_transactions',
  'messages',
  'itinerary_items',
  'financial_records',
  'documents',
  'invitations',
  'field_configs',
  'trips',
  'users',
];

let pool;
let schemaEnsured = false;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || '';
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
}

export function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      if (isProductionRuntime()) {
        throw new Error('DATABASE_URL is required in production/Render. Use your Supabase Postgres connection string.');
      }

      throw new Error('DATABASE_URL or SUPABASE_DB_URL is required to start the backend locally.');
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function closeDatabase() {
  if (pool) {
    const currentPool = pool;
    pool = undefined;
    schemaEnsured = false;
    await currentPool.end();
  }
}

export async function ensureSchema() {
  if (schemaEnsured) {
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      name TEXT DEFAULT '',
      username TEXT NOT NULL UNIQUE,
      date_of_birth TEXT DEFAULT '',
      email TEXT UNIQUE,
      contact_phone TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_title TEXT DEFAULT '',
      contact_show_emergency BOOLEAN NOT NULL DEFAULT FALSE,
      password_hash TEXT DEFAULT '',
      role TEXT NOT NULL,
      personal_data JSONB NOT NULL DEFAULT '[]'::jsonb,
      passport_photo TEXT DEFAULT '',
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      session_token TEXT,
      session_expires_at TIMESTAMPTZ,
      reset_token TEXT,
      reset_token_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_session_token_unique
      ON users (session_token)
      WHERE session_token IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_unique
      ON users (reset_token)
      WHERE reset_token IS NOT NULL;

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      organizer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      traveler_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS field_configs (
      id TEXT PRIMARY KEY,
      field TEXT NOT NULL,
      trip_id TEXT NOT NULL DEFAULT 'default',
      label TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      locked BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      options JSONB NOT NULL DEFAULT '[]'::jsonb,
      section TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS field_configs_field_trip_unique
      ON field_configs (field, trip_id);

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      first_name TEXT DEFAULT '',
      last_name TEXT DEFAULT '',
      name TEXT DEFAULT '',
      role TEXT NOT NULL,
      trip_id TEXT,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      category TEXT DEFAULT '',
      filename TEXT DEFAULT '',
      upload_date TEXT DEFAULT '',
      visible_to JSONB NOT NULL DEFAULT '\"all\"'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      date TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS itinerary_items (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      start_date_time_local TEXT DEFAULT '',
      end_date_time_local TEXT DEFAULT '',
      location TEXT DEFAULT '',
      time_zone TEXT DEFAULT '',
      program_type TEXT NOT NULL DEFAULT 'required',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      recipient_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      content TEXT DEFAULT '',
      read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_reference TEXT NOT NULL,
      provider_payment_reference TEXT DEFAULT '',
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'HUF',
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      financial_record_id TEXT DEFAULT '',
      approval_url TEXT DEFAULT '',
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_provider_reference_unique
      ON payment_transactions (provider, provider_reference);

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      logo_light TEXT DEFAULT '',
      logo_dark TEXT DEFAULT '',
      login_background TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  schemaEnsured = true;
}

export async function isDatabaseEmpty() {
  await ensureSchema();

  for (const tableName of APP_TABLES) {
    const result = await query(`SELECT 1 FROM ${tableName} LIMIT 1`);
    if (result.rowCount > 0) {
      return {
        empty: false,
        tableName,
      };
    }
  }

  return {
    empty: true,
    tableName: '',
  };
}

export async function listNonEmptyTables() {
  await ensureSchema();

  const nonEmptyTables = [];
  for (const tableName of APP_TABLES) {
    const result = await query(`SELECT 1 FROM ${tableName} LIMIT 1`);
    if (result.rowCount > 0) {
      nonEmptyTables.push(tableName);
    }
  }

  return nonEmptyTables;
}

export async function clearAppTables() {
  await ensureSchema();

  if (APP_TABLES.length === 0) {
    return;
  }

  await query(`TRUNCATE TABLE ${APP_TABLES.join(', ')};`);
}
