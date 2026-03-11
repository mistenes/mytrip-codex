import 'express-async-errors';

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './server/routes/auth.js';
import userRoutes from './server/routes/users.js';
import tripRoutes from './server/routes/trips.js';
import documentRoutes from './server/routes/documents.js';
import financialRoutes from './server/routes/financials.js';
import itineraryRoutes from './server/routes/itinerary.js';
import messageRoutes from './server/routes/messages.js';
import invitationRoutes from './server/routes/invitations.js';
import settingsRoutes from './server/routes/settings.js';
import generalRoutes from './server/routes/general.js';

import { ensureAdminUser, ensureDefaultFieldConfigs } from './server/utils/startup.js';
import { splitEnvList, trimTrailingSlash } from './server/utils/request.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

mongoose.set('strictQuery', true);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function buildAllowedOrigins() {
  const origins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  const appUrl = trimTrailingSlash(process.env.APP_URL || '');
  if (appUrl) {
    origins.add(appUrl);
  }

  splitEnvList(process.env.CORS_ORIGIN || '').forEach((origin) => {
    origins.add(trimTrailingSlash(origin));
  });

  return origins;
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  app.use((req, res, next) => {
    const origin = req.get('origin');

    if (origin && allowedOrigins.has(trimTrailingSlash(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
  });

  const publicWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
  });

  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);
  app.use('/api/forgot-password', authLimiter);
  app.use('/api/reset-password', authLimiter);
  app.use('/api/report-problem', publicWriteLimiter);

  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', tripRoutes);
  app.use('/api', documentRoutes);
  app.use('/api', financialRoutes);
  app.use('/api', itineraryRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', invitationRoutes);
  app.use('/api', settingsRoutes);
  app.use('/api', generalRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  app.use(express.static(distPath, {
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ message: 'Invalid JSON payload' });
    }

    console.error('Unhandled server error', {
      method: req.method,
      path: req.originalUrl,
      error: err,
    });

    return res.status(err.statusCode || 500).json({
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    });
  });

  return app;
}

export async function start() {
  const app = createApp();
  const port = Number(process.env.PORT || 3001);
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myTrip';

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  await ensureAdminUser();
  await ensureDefaultFieldConfigs();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received, shutting down`);

    await mongoose.connection.close().catch((error) => {
      console.error('MongoDB shutdown failed', error);
    });

    server.close((error) => {
      if (error) {
        console.error('HTTP server shutdown failed', error);
        process.exit(1);
      }

      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
