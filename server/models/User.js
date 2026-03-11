import mongoose from 'mongoose';

const personalDataSchema = new mongoose.Schema({
  field: String,
  value: String,
  locked: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  username: String,
  dateOfBirth: String,
  email: String,
  contactPhone: String,
  contactEmail: String,
  contactTitle: String,
  contactShowEmergency: { type: Boolean, default: false },
  passwordHash: String,
  role: String,
  personalData: [personalDataSchema],
  passportPhoto: String,
  mustChangePassword: { type: Boolean, default: false },
  sessionToken: String,
  sessionExpiresAt: Date,
  resetToken: String,
  resetTokenExpiresAt: Date,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
