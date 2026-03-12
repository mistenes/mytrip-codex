import Stripe from 'stripe';

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf', 'huf',
]);

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function isPaypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID);
}

export function getPaymentCurrency() {
  return String(process.env.PAYMENT_CURRENCY || 'HUF').toUpperCase();
}

export function getPublicAppUrl(request) {
  const configured = process.env.APP_URL?.replace(/\/+$/, '');
  if (configured) {
    return configured;
  }

  const protocol = request.get('x-forwarded-proto')?.split(',')[0]?.trim() || request.protocol;
  return `${protocol}://${request.get('host')}`;
}

function toStripeAmount(amount, currency) {
  const normalizedCurrency = String(currency || 'HUF').toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

export async function createStripeCheckoutSession({
  request,
  trip,
  user,
  amount,
  currency,
  description,
  paymentTransactionId,
}) {
  const stripe = getStripeClient();
  const appUrl = getPublicAppUrl(request);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl}/?payment=stripe-success&tripId=${trip.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?payment=stripe-cancel&tripId=${trip.id}`,
    customer_email: user.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: toStripeAmount(amount, currency),
          product_data: {
            name: `${trip.name} befizetés`,
            description,
          },
        },
      },
    ],
    metadata: {
      paymentTransactionId,
      tripId: trip.id,
      userId: user.id,
      amount: String(amount),
      currency,
      description,
    },
    payment_intent_data: {
      metadata: {
        paymentTransactionId,
        tripId: trip.id,
        userId: user.id,
      },
    },
  });

  return session;
}

export function constructStripeWebhookEvent(rawBody, signature) {
  const stripe = getStripeClient();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret is not configured');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

function getPaypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPaypalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal is not configured');
  }

  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal access token request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

export async function createPaypalOrder({
  request,
  trip,
  user,
  amount,
  currency,
  description,
  paymentTransactionId,
}) {
  const accessToken = await getPaypalAccessToken();
  const appUrl = getPublicAppUrl(request);

  const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: paymentTransactionId,
          custom_id: paymentTransactionId,
          description,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'myTrip',
        user_action: 'PAY_NOW',
        return_url: `${appUrl}/?payment=paypal-return&tripId=${trip.id}&paymentTransactionId=${paymentTransactionId}`,
        cancel_url: `${appUrl}/?payment=paypal-cancel&tripId=${trip.id}`,
      },
      payer: user.email ? { email_address: user.email } : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal order creation failed: ${response.status}`);
  }

  return response.json();
}

export async function capturePaypalOrder(orderId) {
  const accessToken = await getPaypalAccessToken();
  const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal capture failed: ${response.status}`);
  }

  return response.json();
}

export async function verifyPaypalWebhook(headers, eventBody) {
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    throw new Error('PAYPAL_WEBHOOK_ID is required');
  }

  const accessToken = await getPaypalAccessToken();
  const response = await fetch(`${getPaypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: eventBody,
    }),
  });

  if (!response.ok) {
    throw new Error(`PayPal webhook verification failed: ${response.status}`);
  }

  const verification = await response.json();
  return verification.verification_status === 'SUCCESS';
}
