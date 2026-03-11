import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema({
    tripId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    description: String,
    amount: Number,
    date: String,
}, { timestamps: true });

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);
export default FinancialRecord;
