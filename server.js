/**
 * Minimal Express server for Stripe + PayPal wallet demo.
 *
 * How to run:
 *   1. npm i
 *   2. npm run start
 *
 * Test webhooks with the Stripe CLI:
 *   stripe listen --forward-to localhost:4242/webhook
 *
 * Environment variables (.env):
 *   STRIPE_SECRET_KEY=sk_test_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *   PAYPAL_CLIENT_ID=...
 *
 * Note: Enable Apple Pay in the Stripe Dashboard and register your domain.
 */
require('dotenv').config();

const express = require('express');
const path = require('path');

// TODO: Set your Stripe secret key in the .env file
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Webhook endpoint must parse the raw body
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // TODO: set STRIPE_WEBHOOK_SECRET in .env
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
  }

  res.json({ received: true });
});

app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Server running on port ${port}`));
