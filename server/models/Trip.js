import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    name: String,
    startDate: String,
    endDate: String,
    organizerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    travelerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
