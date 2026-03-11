import mongoose from 'mongoose';

const fieldConfigSchema = new mongoose.Schema({
    field: String,
    tripId: { type: String, default: 'default' },
    label: String,
    type: { type: String, enum: ['text', 'date', 'file', 'radio', 'multi'], default: 'text' },
    enabled: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    options: { type: [String], default: [] },
    section: { type: String, default: 'general' }
}, { timestamps: true });

const FieldConfig = mongoose.model('FieldConfig', fieldConfigSchema);
export default FieldConfig;
