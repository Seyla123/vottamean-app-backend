// Import Stripe instance from the config file
const stripe = require('../config/stripe');

// Database models
const { Subscription, Payment } = require('../models');

// Error handling utilities
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Helper functions for date manipulation
const { addMonths, addYears } = require('../utils/datePaymentUtils');

// ----------------------------
// CREATE PAYMENT INTENT
// ----------------------------
exports.createPaymentIntent = catchAsync(async (req, res, next) => {
  const { admin_id, plan_type, payment_method_id } = req.body;

  // Get the amount based on the plan type (monthly/yearly)
  const amount = getPlanAmount(plan_type);
  if (!amount) {
    return next(new AppError('Invalid plan type', 400));
  }

  // Create a Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'USD',
    payment_method: payment_method_id,
    confirm: true,
  });

  // If payment succeeds, create Subscription and Payment records
  const subscription = await Subscription.create({
    admin_id: admin_id,
    plan_type: plan_type,
    start_date: new Date(),
    end_date:
      plan_type === 'monthly'
        ? addMonths(new Date(), 1)
        : addYears(new Date(), 1),
    status: 'active',
  });

  await Payment.create({
    admin_id: admin_id,
    subscription_id: subscription.subscription_id,
    amount: (amount / 100).toFixed(2),
    payment_method: paymentIntent.payment_method,
    payment_status:
      paymentIntent.status === 'succeeded' ? 'successful' : 'failed',
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment successful, subscription activated',
    subscription,
  });
});

// ----------------------------
// STRIPE WEBHOOK HANDLER
// ----------------------------
exports.handleStripeWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return next(new AppError(`Webhook Error: ${err.message}`, 400));
  }

  // Handle the event
  const {
    type,
    data: { object: paymentIntent },
  } = event;

  switch (type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(paymentIntent);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(paymentIntent);
      break;

    default:
      console.log(`Unhandled event type ${type}`);
  }

  res.status(200).json({ received: true });
});

// ----------------------------
// HELPER FUNCTIONS
// ----------------------------
const getPlanAmount = (plan_type) => {
  if (plan_type === 'monthly') {
    return 10 * 100; // $10 in cents
  } else if (plan_type === 'yearly') {
    return 100 * 100; // $100 in cents
  } else {
    return null;
  }
};

const handlePaymentSucceeded = async (paymentIntent) => {
  const subscription = await Subscription.findOne({
    where: { admin_id: paymentIntent.customer },
  });
  if (subscription) {
    await Payment.update(
      { payment_status: 'successful' },
      { where: { subscription_id: subscription.subscription_id } }
    );
    await Subscription.update(
      { status: 'active' },
      { where: { subscription_id: subscription.subscription_id } }
    );
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  const subscription = await Subscription.findOne({
    where: { admin_id: paymentIntent.customer },
  });

  if (subscription) {
    await Payment.update(
      { payment_status: 'failed' },
      { where: { subscription_id: subscription.subscription_id } }
    );
    await Subscription.update(
      { status: 'expired' },
      { where: { subscription_id: subscription.subscription_id } }
    );
  }
};
