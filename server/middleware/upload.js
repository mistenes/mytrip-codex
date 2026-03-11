import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Going up two levels from server/middleware to root, then into 'uploads'
// Or simpler: process.cwd() + /uploads if running from root. 
// Original code used __dirname (which was root/server.js) + 'uploads'.
// If we run 'node server.js' from root, __dirname in server.js is root.
// In this file, __dirname is root/server/middleware.
// We want root/uploads.

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
        cb(null, unique);
    }
});

const upload = multer({ storage });

export { upload, uploadDir };
