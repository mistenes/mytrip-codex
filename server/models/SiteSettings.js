import BaseModel from '../db/BaseModel.js';

export default class SiteSettings extends BaseModel {
  static tableName = 'site_settings';

  static defaults = {
    logoLight: '',
    logoDark: '',
    loginBackground: '',
  };
}
