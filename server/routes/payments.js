import express from 'express';

import Document from '../models/Document.js';
import FinancialRecord from '../models/FinancialRecord.js';
import Message from '../models/Message.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { canAccessTrip, isAdmin, isTraveler, isTripManager } from '../utils/accessControl.js';
import {
  capturePaypalOrder,
  constructStripeWebhookEvent,
  createPaypalOrder,
  createStripeCheckoutSession,
  getPaymentCurrency,
  isPaypalConfigured,
  isStripeConfigured,
  verifyPaypalWebhook,
} from '../utils/payments.js';

const router = express.Router();

function serializePayment(transaction) {
  return {
    id: transaction.id || transaction._id,
    tripId: String(transaction.tripId),
    userId: String(transaction.userId),
    provider: transaction.provider,
    amount: transaction.amount,
    currency: transaction.currency,
    description: transaction.description,
    status: transaction.status,
    providerReference: transaction.providerReference,
    providerPaymentReference: transaction.providerPaymentReference,
    financialRecordId: transaction.financialRecordId,
    approvalUrl: transaction.approvalUrl,
    completedAt: transaction.completedAt,
    createdAt: transaction.createdAt,
  };
}

function getParticipantIds(trip) {
  return new Set([
    ...(trip.organizerIds || []).map(String),
    ...(trip.travelerIds || []).map(String),
  ]);
}

async function resolveTripAndPayer(req, res) {
  const trip = await Trip.findById(req.params.tripId);
  if (!trip) {
    res.sendStatus(404);
    return null;
  }

  if (!(await canAccessTrip(req.user, trip))) {
    res.sendStatus(403);
    return null;
  }

  const requestedUserId = String(req.body.userId || req.user.id || req.user._id || '').trim();
  const payerUserId = isTraveler(req.user) ? String(req.user.id || req.user._id) : requestedUserId;
  const participantIds = getParticipantIds(trip);

  if (!participantIds.has(payerUserId)) {
    res.status(400).json({ message: 'A kiválasztott felhasználó nincs hozzárendelve az utazáshoz.' });
    return null;
  }

  if (isTraveler(req.user) && payerUserId !== String(req.user.id || req.user._id)) {
    res.sendStatus(403);
    return null;
  }

  const payer = await User.findById(payerUserId);
  if (!payer) {
    res.status(400).json({ message: 'A befizető felhasználó nem található.' });
    return null;
  }

  return {
    trip,
    payer,
  };
}

async function completePaymentTransaction(transaction, payload = {}, providerPaymentReference = '') {
  if (!transaction) {
    throw new Error('Payment transaction not found');
  }

  transaction.rawPayload = payload;
  if (providerPaymentReference) {
    transaction.providerPaymentReference = providerPaymentReference;
  }

  if (transaction.financialRecordId) {
    transaction.status = 'completed';
    if (!transaction.completedAt) {
      transaction.completedAt = new Date();
    }
    await transaction.save();
    return transaction;
  }

  const financialRecord = await FinancialRecord.create({
    tripId: transaction.tripId,
    userId: transaction.userId,
    description: transaction.description || `${transaction.provider.toUpperCase()} befizetés`,
    amount: Math.abs(Number(transaction.amount || 0)),
    date: new Date().toISOString().split('T')[0],
  });

  transaction.status = 'completed';
  transaction.financialRecordId = financialRecord.id || financialRecord._id;
  transaction.completedAt = new Date();
  await transaction.save();

  return transaction;
}

async function failPaymentTransaction(transaction, payload = {}) {
  if (!transaction) {
    return;
  }

  transaction.status = 'failed';
  transaction.rawPayload = payload;
  await transaction.save();
}

async function findStripeTransaction(session) {
  const metadataId = String(session?.metadata?.paymentTransactionId || '').trim();
  if (metadataId) {
    return PaymentTransaction.findById(metadataId);
  }

  const sessionId = String(session?.id || '').trim();
  if (!sessionId) {
    return null;
  }

  return PaymentTransaction.findOne({ provider: 'stripe', providerReference: sessionId });
}

async function findPaypalTransactionFromOrderPayload(payload) {
  const resource = payload?.resource || {};
  const customId = String(
    resource.custom_id ||
    resource.invoice_id ||
    resource.purchase_units?.[0]?.custom_id ||
    resource.purchase_units?.[0]?.reference_id ||
    ''
  ).trim();

  if (customId) {
    const byId = await PaymentTransaction.findById(customId);
    if (byId) {
      return byId;
    }
  }

  const orderId = String(
    resource.id ||
    resource.supplementary_data?.related_ids?.order_id ||
    payload?.resource?.supplementary_data?.related_ids?.order_id ||
    ''
  ).trim();

  if (!orderId) {
    return null;
  }

  return PaymentTransaction.findOne({ provider: 'paypal', providerReference: orderId });
}

export async function stripeWebhookHandler(req, res) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ message: 'Stripe is not configured' });
  }

  const signature = req.get('stripe-signature') || '';

  let event;
  try {
    event = constructStripeWebhookEvent(req.body, signature);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const transaction = await findStripeTransaction(session);
      if (transaction) {
        transaction.providerReference = session.id;
        await completePaymentTransaction(transaction, session, String(session.payment_intent || session.id));
      }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object;
      const transaction = await findStripeTransaction(session);
      await failPaymentTransaction(transaction, session);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handling failed', error);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
}

router.get('/payment-transactions', auth, async (req, res) => {
  const accessibleTrips = await Trip.find().lean();
  const allowedTripIds = [];

  for (const trip of accessibleTrips) {
    if (await canAccessTrip(req.user, trip)) {
      allowedTripIds.push(String(trip._id || trip.id));
    }
  }

  let transactions = await PaymentTransaction.find().sort({ createdAt: -1 }).lean();
  transactions = transactions.filter((transaction) => allowedTripIds.includes(String(transaction.tripId)));

  if (isTraveler(req.user)) {
    transactions = transactions.filter((transaction) => String(transaction.userId) === String(req.user.id || req.user._id));
  }

  if (req.query.tripId) {
    transactions = transactions.filter((transaction) => String(transaction.tripId) === String(req.query.tripId));
  }

  return res.json(transactions.map(serializePayment));
});

router.post('/trips/:tripId/payments/stripe/checkout', auth, async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ message: 'Stripe is not configured' });
  }

  const resolved = await resolveTripAndPayer(req, res);
  if (!resolved) {
    return;
  }

  const { trip, payer } = resolved;
  const amount = Number(req.body.amount);
  const currency = getPaymentCurrency();
  const description = String(req.body.description || `${trip.name} online befizetés`).trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Érvényes befizetési összeg szükséges.' });
  }

  const pendingTransaction = await PaymentTransaction.create({
    tripId: trip.id || trip._id,
    userId: payer.id || payer._id,
    provider: 'stripe',
    providerReference: `pending-${Date.now()}`,
    amount,
    currency,
    description,
    status: 'pending',
  });

  try {
    const session = await createStripeCheckoutSession({
      request: req,
      trip,
      user: payer,
      amount,
      currency,
      description,
      paymentTransactionId: pendingTransaction.id || pendingTransaction._id,
    });

    pendingTransaction.providerReference = session.id;
    pendingTransaction.rawPayload = session;
    await pendingTransaction.save();

    return res.status(201).json({
      checkoutUrl: session.url,
      paymentTransaction: serializePayment(pendingTransaction),
    });
  } catch (error) {
    await failPaymentTransaction(pendingTransaction, { message: error.message });
    return res.status(502).json({ message: 'Nem sikerült Stripe fizetést indítani.' });
  }
});

router.post('/trips/:tripId/payments/paypal/order', auth, async (req, res) => {
  if (!isPaypalConfigured()) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  const resolved = await resolveTripAndPayer(req, res);
  if (!resolved) {
    return;
  }

  const { trip, payer } = resolved;
  const amount = Number(req.body.amount);
  const currency = getPaymentCurrency();
  const description = String(req.body.description || `${trip.name} PayPal befizetés`).trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Érvényes befizetési összeg szükséges.' });
  }

  const pendingTransaction = await PaymentTransaction.create({
    tripId: trip.id || trip._id,
    userId: payer.id || payer._id,
    provider: 'paypal',
    providerReference: `pending-${Date.now()}`,
    amount,
    currency,
    description,
    status: 'pending',
  });

  try {
    const order = await createPaypalOrder({
      request: req,
      trip,
      user: payer,
      amount,
      currency,
      description,
      paymentTransactionId: pendingTransaction.id || pendingTransaction._id,
    });

    const approvalUrl = (order.links || []).find((link) => link.rel === 'approve')?.href || '';
    pendingTransaction.providerReference = order.id;
    pendingTransaction.approvalUrl = approvalUrl;
    pendingTransaction.rawPayload = order;
    await pendingTransaction.save();

    return res.status(201).json({
      approvalUrl,
      orderId: order.id,
      paymentTransaction: serializePayment(pendingTransaction),
    });
  } catch (error) {
    await failPaymentTransaction(pendingTransaction, { message: error.message });
    return res.status(502).json({ message: 'Nem sikerült PayPal fizetést indítani.' });
  }
});

router.post('/payments/paypal/capture', auth, async (req, res) => {
  if (!isPaypalConfigured()) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  const orderId = String(req.body.orderId || '').trim();
  const paymentTransactionId = String(req.body.paymentTransactionId || '').trim();

  if (!orderId && !paymentTransactionId) {
    return res.status(400).json({ message: 'orderId vagy paymentTransactionId szükséges.' });
  }

  let transaction = null;
  if (paymentTransactionId) {
    transaction = await PaymentTransaction.findById(paymentTransactionId);
  }
  if (!transaction && orderId) {
    transaction = await PaymentTransaction.findOne({ provider: 'paypal', providerReference: orderId });
  }

  if (!transaction) {
    return res.sendStatus(404);
  }

  const trip = await Trip.findById(transaction.tripId);
  if (!trip || !(await canAccessTrip(req.user, trip))) {
    return res.sendStatus(403);
  }

  try {
    const capture = await capturePaypalOrder(orderId || transaction.providerReference);
    transaction.providerReference = orderId || transaction.providerReference;
    const captureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
    await completePaymentTransaction(transaction, capture, captureId);
    return res.json({ transaction: serializePayment(transaction) });
  } catch (error) {
    await failPaymentTransaction(transaction, { message: error.message });
    return res.status(502).json({ message: 'A PayPal jóváírás nem sikerült.' });
  }
});

router.post('/webhooks/paypal', async (req, res) => {
  if (!isPaypalConfigured()) {
    return res.status(503).json({ message: 'PayPal is not configured' });
  }

  try {
    const verified = await verifyPaypalWebhook(req.headers, req.body);
    if (!verified) {
      return res.status(400).json({ message: 'Invalid PayPal webhook signature' });
    }

    if (req.body?.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const transaction = await findPaypalTransactionFromOrderPayload(req.body);
      if (transaction) {
        const captureId = req.body?.resource?.id || '';
        await completePaymentTransaction(transaction, req.body, captureId);
      }
    }

    if (req.body?.event_type === 'PAYMENT.CAPTURE.DENIED' || req.body?.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const transaction = await findPaypalTransactionFromOrderPayload(req.body);
      if (req.body?.event_type === 'PAYMENT.CAPTURE.DENIED') {
        await failPaymentTransaction(transaction, req.body);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook handling failed', error);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;
