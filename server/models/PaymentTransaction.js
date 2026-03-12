import BaseModel from '../db/BaseModel.js';

export default class PaymentTransaction extends BaseModel {
  static tableName = 'payment_transactions';

  static columnMap = {
    providerReference: 'provider_reference',
    providerPaymentReference: 'provider_payment_reference',
    financialRecordId: 'financial_record_id',
    approvalUrl: 'approval_url',
    rawPayload: 'raw_payload',
    completedAt: 'completed_at',
  };

  static jsonFields = ['rawPayload'];

  static defaults = {
    tripId: '',
    userId: '',
    provider: '',
    providerReference: '',
    providerPaymentReference: '',
    amount: 0,
    currency: 'HUF',
    description: '',
    status: 'pending',
    financialRecordId: '',
    approvalUrl: '',
    rawPayload: {},
    completedAt: undefined,
  };
}
