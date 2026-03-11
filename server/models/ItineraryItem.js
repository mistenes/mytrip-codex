import mongoose from 'mongoose';

const itineraryItemSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    startDateTimeLocal: String,
    endDateTimeLocal: String,
    location: String,
    timeZone: String,
    programType: { type: String, default: 'required' }
}, { timestamps: true });

const ItineraryItem = mongoose.model('ItineraryItem', itineraryItemSchema);
export default ItineraryItem;
