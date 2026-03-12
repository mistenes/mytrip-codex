import BaseModel from '../db/BaseModel.js';

export default class Message extends BaseModel {
  static tableName = 'messages';

  static jsonFields = ['recipientIds', 'readBy'];

  static defaults = {
    tripId: '',
    authorId: '',
    recipientIds: [],
    content: '',
    readBy: [],
  };
}
