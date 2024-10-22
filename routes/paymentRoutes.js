// Import necessary modules
const express = require('express');

// Import Controllers
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');

// Define Express Router
const router = express.Router();

// Stripe webhook endpoint (for handling payment events from Stripe)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

// Protect all routes after this middleware
router.use(authController.protect);

// Require email verification for payment routes
router.use(authController.requireEmailVerification);

// Get all payment data
router.get('/get-all-payments', paymentController.getAllPayments);

// Get all subscriptions data for payment
router.get('/get-all-subscriptions', paymentController.getAllSubscriptions);

// Cancel a subscription
router.post('/cancel-subscription', paymentController.cancelSubscription);

// Create a payment intent (for creating subscriptions)
// router.post('/create-payment-intent', paymentController.createPaymentIntent);

router.post('/checkout', paymentController.createCheckoutSession);

router.get('/checkout/sessions/:id', paymentController.getCheckoutSession);

module.exports = router;
