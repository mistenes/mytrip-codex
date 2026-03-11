import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    lastName: String,
    name: String,
    role: String,
    tripId: mongoose.Schema.Types.ObjectId,
    token: String,
    expiresAt: Date,
    used: { type: Boolean, default: false }
}, { timestamps: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
