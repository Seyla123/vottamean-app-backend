// config/stripe.js
const Stripe = require('stripe');
const stripe = Stripe(
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY
);

module.exports = stripe;
