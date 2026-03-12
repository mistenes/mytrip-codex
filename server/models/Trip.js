import BaseModel from '../db/BaseModel.js';

export default class Trip extends BaseModel {
  static tableName = 'trips';

  static jsonFields = ['organizerIds', 'travelerIds'];

  static defaults = {
    name: '',
    startDate: '',
    endDate: '',
    organizerIds: [],
    travelerIds: [],
  };
}
