// Import necessary modules
const express = require('express');

// Import Controllers
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');

// Define Express Router
const router = express.Router();

// // Protect all routes after this middleware
// router.use(authController.protect);

// // Require email verification for payment routes
// router.use(authController.requireEmailVerification);

// Create a payment intent (for creating subscriptions)
router.post('/create-payment-intent', paymentController.createPaymentIntent);

router.post(
  '/create-checkout-session',
  paymentController.createCheckoutSession
);

// Stripe webhook endpoint (for handling payment events from Stripe)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   (req, res) => {
//     console.log('Received webhook:', req.body);
//     res.status(200).json({ received: true });
//   }
// );

module.exports = router;
