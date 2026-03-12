import BaseModel from '../db/BaseModel.js';

export default class Document extends BaseModel {
  static tableName = 'documents';

  static jsonFields = ['visibleTo'];

  static defaults = {
    tripId: '',
    userId: '',
    name: '',
    category: '',
    filename: '',
    uploadDate: '',
    visibleTo: 'all',
  };
}
