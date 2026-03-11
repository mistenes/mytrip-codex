import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    category: String,
    filename: String,
    uploadDate: String,
    visibleTo: { type: mongoose.Schema.Types.Mixed, default: 'all' }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
