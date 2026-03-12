import BaseModel from '../db/BaseModel.js';

export default class Trip extends BaseModel {
  static tableName = 'trips';

  static defaults = {
    name: '',
    startDate: '',
    endDate: '',
    organizerIds: [],
    travelerIds: [],
  };
}
