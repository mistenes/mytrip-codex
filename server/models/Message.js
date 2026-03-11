import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    authorId: mongoose.Schema.Types.ObjectId,
    recipientIds: [mongoose.Schema.Types.ObjectId],
    content: String,
    readBy: { type: [mongoose.Schema.Types.ObjectId], default: [] }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
