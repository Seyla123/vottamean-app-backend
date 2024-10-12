const stripe = require('../config/stripe');
const { Subscription, Payment, Admin } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  getPlanAmount,
  handleCheckoutSessionCompleted,
  handlePaymentFailed,
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

  // Check for missing required fields
  if (!admin_id || !plan_type || !duration) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required fields: admin_id, plan_type, or duration',
    });
  }

  const validPlanTypes = ['basic', 'standard', 'premium'];
  const validDurations = ['trial', 'monthly', 'yearly'];

  // Validate the plan type and duration
  if (
    !validPlanTypes.includes(plan_type) ||
    !validDurations.includes(duration)
  ) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid plan_type or duration',
    });
  }

  // Fetch the active subscription of the user
  const currentSubscription = await Subscription.findOne({
    where: { admin_id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  // Check if the user already has an active plan and if they are trying to switch to a different plan
  if (currentSubscription) {
    const { plan_type: currentPlanType } = currentSubscription;

    // Allow upgrade only from 'basic' to other plans
    if (currentPlanType !== 'basic' && currentPlanType !== plan_type) {
      return res.status(400).json({
        status: 'fail',
        message: `You are currently subscribed to the ${currentPlanType} plan. Please cancel your current subscription before switching to the ${plan_type} plan.`,
      });
    }
  }

  // Calculate the plan amount based on plan type and duration
  const amount = getPlanAmount(plan_type, duration);
  if (!amount) {
    return next(new AppError('Invalid plan type or duration', 400));
  }

  // Define success and cancel URLs for the Stripe checkout session
  const successUrl =
    process.env.CLIENT_PAYMENT_SUCCESS_URL ||
    `${req.protocol}://${req.get('host')}/payment/success`;
  const cancelUrl =
    process.env.CLIENT_PAYMENT_FAILURE_URL ||
    `${req.protocol}://${req.get('host')}/payment/failure`;

  try {
    // Create a new Stripe checkout session
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
              interval: duration === 'monthly' ? 'month' : 'year',
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

    // Return the checkout session URL to the client
    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    // Handle Stripe errors
    return next(new AppError(error.message, 400));
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
