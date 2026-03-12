import BaseModel from '../db/BaseModel.js';

export default class User extends BaseModel {
  static tableName = 'users';

  static jsonFields = ['personalData'];

  static defaults = {
    firstName: '',
    lastName: '',
    name: '',
    username: '',
    dateOfBirth: '',
    email: '',
    contactPhone: '',
    contactEmail: '',
    contactTitle: '',
    contactShowEmergency: false,
    passwordHash: '',
    role: 'traveler',
    personalData: [],
    passportPhoto: '',
    mustChangePassword: false,
    sessionToken: undefined,
    sessionExpiresAt: undefined,
    resetToken: undefined,
    resetTokenExpiresAt: undefined,
  };
}
