import BaseModel from '../db/BaseModel.js';

export default class ItineraryItem extends BaseModel {
  static tableName = 'itinerary_items';

  static defaults = {
    tripId: '',
    title: '',
    description: '',
    startDateTimeLocal: '',
    endDateTimeLocal: '',
    location: '',
    timeZone: '',
    programType: 'required',
  };
}
