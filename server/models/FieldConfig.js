import BaseModel from '../db/BaseModel.js';

export default class FieldConfig extends BaseModel {
  static tableName = 'field_configs';

  static columnMap = {
    order: 'sort_order',
  };

  static jsonFields = ['options'];

  static defaults = {
    field: '',
    tripId: 'default',
    label: '',
    type: 'text',
    enabled: true,
    locked: false,
    order: 0,
    options: [],
    section: 'general',
  };
}
