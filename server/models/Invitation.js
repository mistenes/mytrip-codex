import BaseModel from '../db/BaseModel.js';

export default class Invitation extends BaseModel {
  static tableName = 'invitations';

  static defaults = {
    email: '',
    firstName: '',
    lastName: '',
    name: '',
    role: 'traveler',
    tripId: '',
    token: '',
    expiresAt: undefined,
    used: false,
  };
}
