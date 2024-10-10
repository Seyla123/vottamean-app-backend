// Import Stripe instance from the config file
const stripe = require('../config/stripe');

// Database models
const { Subscription, Payment, Admin } = require('../models');

// Error handling utilities
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Helper functions for date manipulation
const {
  checkActiveSubscription,
  addMonths,
  addYears,
} = require('../utils/paymentHelper');

//

// -----------------------------------
// GET ALL SUBSCRIPTION PLAN TO CHECK
// -----------------------------------
exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
  // Query the Subscription model to retrieve all subscription data
  const subscriptions = await Subscription.findAll({
    include: [{ model: Admin, as: 'Admin' }],
    order: [['subscription_id', 'ASC']],
  });

  // If no subscriptions found, return an error
  if (!subscriptions || subscriptions.length === 0) {
    return next(new AppError('No subscriptions found', 404));
  }

  // Return the subscription data in the response
  res.status(200).json({
    status: 'success',
    results: subscriptions.length,
    data: {
      subscriptions,
    },
  });
});

// -----------------------------------
// GET ALL PAYMENT PURCHASE TO CHECK
// -----------------------------------
exports.getAllPayments = catchAsync(async (req, res, next) => {
  // Query the Payment model to retrieve all payment data
  const payments = await Payment.findAll({
    include: [{ model: Admin, as: 'Admin' }],
    order: [['payment_id', 'ASC']],
  });

  // If no payments found, return an error
  if (!payments || payments.length === 0) {
    return next(new AppError('No payments found', 404));
  }

  // Return the payment data in the response
  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments,
    },
  });
});

// -----------------------------------
// CANCEL SUBSCRIPTION
// -----------------------------------
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const { admin_id } = req.body;

  if (!admin_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required field: admin_id',
    });
  }

  const activeSubscription = await Subscription.findOne({
    where: {
      admin_id: admin_id,
      status: 'active',
    },
    order: [['createdAt', 'DESC']],
  });

  if (!activeSubscription) {
    return res.status(400).json({
      status: 'fail',
      message: 'No active subscription found to cancel.',
    });
  }

  // Check if the subscription is a free one
  if (activeSubscription.plan_type && activeSubscription.plan_type === 'free') {
    return res.status(400).json({
      status: 'fail',
      message: 'Cannot cancel a free subscription.',
    });
  }

  // Log the stripe_subscription_id for debugging
  console.log(
    'Stripe Subscription ID:',
    activeSubscription.stripe_subscription_id
  );

  // Validate if stripe_subscription_id exists
  if (!activeSubscription.stripe_subscription_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Stripe subscription ID is missing or undefined.',
    });
  }

  // Cancel the subscription in Stripe
  try {
    await stripe.subscriptions.cancel(
      activeSubscription.stripe_subscription_id
    );
  } catch (error) {
    return next(
      new AppError(
        `Error canceling subscription in Stripe: ${error.message}`,
        400
      )
    );
  }

  await Subscription.update(
    { status: 'canceled' },
    { where: { subscription_id: activeSubscription.subscription_id } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription canceled successfully.',
  });
});

// -----------------------------------
// CREATE CHECKOUT SESSION : Stripe UI
// -----------------------------------
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { admin_id, plan_type } = req.body;

  if (!admin_id || !plan_type) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required fields: admin_id or plan_type',
    });
  }

  // Check if the admin has an active subscription
  try {
    await checkActiveSubscription(admin_id);
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }

  const amount = getPlanAmount(plan_type);
  if (!amount) {
    return next(new AppError('Invalid plan type', 400));
  }

  // Create a new Stripe Checkout Session
  const successUrl =
    process.env.CLIENT_PAYMENT_SUCCESS_URL ||
    `${req.protocol}://${req.get('host')}/payment/success`;
  const cancelUrl =
    process.env.CLIENT_PAYMENT_FAILURE_URL ||
    `${req.protocol}://${req.get('host')}/payment/failure`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Subscription - ${plan_type}`,
            },
            unit_amount: amount,
            recurring: {
              interval: plan_type === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        admin_id: admin_id,
        plan_type: plan_type,
      },
    });

    res.status(200).json({
      status: 'success',
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return next(new AppError(error.message, 400));
  }
});

// ---------------------------------
// CREATE PAYMENT INTENT : Custom UI
// ---------------------------------
exports.createPaymentIntent = catchAsync(async (req, res, next) => {
  const { admin_id, plan_type, payment_method_id } = req.body;

  if (!admin_id || !plan_type || !payment_method_id) {
    return res.status(400).json({
      status: 'fail',
      message:
        'Missing required fields: admin_id, plan_type, or payment_method_id',
    });
  }

  // Check if the admin has an active subscription
  try {
    await checkActiveSubscription(admin_id);
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }

  const amount = getPlanAmount(plan_type);
  if (!amount) {
    return next(new AppError('Invalid plan type', 400));
  }

  // Create a Stripe PaymentIntent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'USD',
      payment_method: payment_method_id,
      confirm: false,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
    console.log('Payment Intent Created:', paymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return next(new AppError(error.message, error.statusCode || 500));
  }

  // Respond with the client_secret immediately after creating the PaymentIntent
  res.status(200).json({
    status: 'success',
    client_secret: paymentIntent.client_secret,
  });

  // Confirm the PaymentIntent in the background to avoid sending multiple responses
  try {
    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id
    );
    console.log('Confirmed Payment Intent:', confirmedIntent);

    // Check the confirmed intent status
    if (confirmedIntent.status === 'succeeded') {
      // Handle successful payment and create records
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
        payment_method: confirmedIntent.payment_method,
        payment_status: 'successful',
      });

      // Note: cannot send another response here because one has already been sent
      // Instead, can log or handle any additional operations needed.
      console.log('Payment successful, subscription activated:', subscription);
    } else if (confirmedIntent.status === 'requires_action') {
      console.log('Payment requires additional authentication.');
    } else if (confirmedIntent.status === 'requires_payment_method') {
      console.error(
        'Payment failed, please try with a different payment method.'
      );
    } else {
      console.error('Payment not successful, please try again.');
    }
  } catch (error) {
    console.error('Error confirming payment intent:', error);
  }
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

  const {
    type,
    data: { object: session },
  } = event;

  switch (type) {
    case 'checkout.session.completed':
      // Handle successful checkout session
      await handleCheckoutSessionCompleted(session);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(session);
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

// Function to handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  // Get the admin ID from the session object
  const admin_id = session.metadata.admin_id;

  // Get the plan type from the session object
  const plan_type = session.metadata.plan_type;

  // Get the subscription ID from the session object
  const subscriptionId = session.subscription;

  // Create a subscription record in the database
  const subscription = await Subscription.create({
    admin_id: admin_id,
    plan_type: plan_type,
    stripe_subscription_id: subscriptionId,
    start_date: new Date(),
    end_date:
      plan_type === 'monthly'
        ? addMonths(new Date(), 1)
        : addYears(new Date(), 1),
    status: 'active',
  });

  // Create a payment record in the database
  await Payment.create({
    admin_id: admin_id,
    subscription_id: subscription.subscription_id,
    amount: (session.amount_total / 100).toFixed(2),
    payment_method: session.payment_method_types[0],
    payment_status: 'successful',
  });

  console.log(`Payment and subscription recorded for admin_id: ${admin_id}`);
};

// Function to handle failed payment
const handlePaymentFailed = async (session) => {
  const admin_id = session.metadata.admin_id;

  const subscription = await Subscription.findOne({
    where: { admin_id: admin_id },
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
  console.error(`Payment failed for admin_id: ${admin_id}`);
};
