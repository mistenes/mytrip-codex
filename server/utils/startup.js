import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FieldConfig from '../models/FieldConfig.js';
import { getDefaultFieldConfigs } from './defaultFieldConfigs.js';

export async function ensureAdminUser() {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        console.warn('ADMIN_PASSWORD not set; admin user not created');
        return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
        username: 'admin',
        role: 'admin',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        mustChangePassword: true,
        email: 'admin@example.com',
    });

    console.log('Seeded admin user');
}

export async function ensureDefaultFieldConfigs() {
    const defaults = getDefaultFieldConfigs();

    for (const def of defaults) {
        await FieldConfig.findOneAndUpdate(
            { field: def.field, tripId: 'default' },
            { ...def, tripId: 'default' },
            { upsert: true }
        );
    }
}
