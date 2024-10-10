const stripe = require('../config/stripe');
const { Subscription, Payment, Admin } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  checkActiveSubscription,
  addMonths,
  addYears,
} = require('../utils/paymentHelper');

// -----------------------------------
// GET ALL SUBSCRIPTION PLAN TO CHECK
// -----------------------------------
exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await Subscription.findAll({
    include: [{ model: Admin, as: 'Admin' }],
    order: [['subscription_id', 'ASC']],
  });

  if (!subscriptions || subscriptions.length === 0) {
    return next(new AppError('No subscriptions found', 404));
  }

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
  const payments = await Payment.findAll({
    include: [{ model: Admin, as: 'Admin' }],
    order: [['payment_id', 'ASC']],
  });

  if (!payments || payments.length === 0) {
    return next(new AppError('No payments found', 404));
  }

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
    where: { admin_id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  if (!activeSubscription) {
    return res.status(400).json({
      status: 'fail',
      message: 'No active subscription found to cancel.',
    });
  }

  if (activeSubscription.plan_type === 'trial') {
    return res.status(400).json({
      status: 'fail',
      message: 'Cannot cancel a free trial subscription.',
    });
  }

  if (!activeSubscription.stripe_subscription_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Stripe subscription ID is missing or undefined.',
    });
  }

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
  const { admin_id, plan_type, duration } = req.body;

  if (!admin_id || !plan_type || !duration) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required fields: admin_id, plan_type, or duration',
    });
  }

  const validPlanTypes = ['basic', 'standard', 'premium'];
  const validDurations = ['trial', 'monthly', 'yearly'];

  if (
    !validPlanTypes.includes(plan_type) ||
    !validDurations.includes(duration)
  ) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid plan_type or duration',
    });
  }

  try {
    await checkActiveSubscription(admin_id);
  } catch (error) {
    return res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }

  const amount = getPlanAmount(plan_type, duration);
  if (!amount) {
    return next(new AppError('Invalid plan type or duration', 400));
  }

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
              name: `Subscription - ${plan_type} (${duration})`,
            },
            unit_amount: amount,
            recurring: {
              interval:
                duration === 'monthly'
                  ? 'month'
                  : duration === 'yearly'
                  ? 'year'
                  : undefined,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        admin_id,
        plan_type,
        duration,
      },
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
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
const getPlanAmount = (plan_type, duration) => {
  if (plan_type === 'standard' && duration === 'monthly') return 20 * 100;
  if (plan_type === 'standard' && duration === 'yearly') return 200 * 100;
  if (plan_type === 'premium' && duration === 'monthly') return 50 * 100;
  if (plan_type === 'premium' && duration === 'yearly') return 500 * 100;
  if (duration === 'trial') return 0;
  return null;
};

const handleCheckoutSessionCompleted = async (session) => {
  const { admin_id, plan_type, duration } = session.metadata;
  const subscriptionId = session.subscription;

  // Calculate the end date based on the subscription duration
  const end_date =
    duration === 'monthly' ? addMonths(new Date(), 1) : addYears(new Date(), 1);

  const subscription = await Subscription.create({
    admin_id,
    plan_type,
    duration, // Store the duration directly to the subscription record
    stripe_subscription_id: subscriptionId,
    start_date: new Date(),
    end_date,
    status: 'active',
  });

  await Payment.create({
    admin_id,
    subscription_id: subscription.subscription_id,
    amount: (session.amount_total / 100).toFixed(2),
    payment_method: session.payment_method_types[0],
    payment_status: 'successful',
  });

  console.log(`Payment and subscription recorded for admin_id: ${admin_id}`);
};

const handlePaymentFailed = async (session) => {
  const { admin_id } = session.metadata;

  const subscription = await Subscription.findOne({
    where: { admin_id },
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
