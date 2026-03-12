import BaseModel from '../db/BaseModel.js';

export default class FinancialRecord extends BaseModel {
  static tableName = 'financial_records';

  static defaults = {
    tripId: '',
    userId: '',
    description: '',
    amount: 0,
    date: '',
  };
}
