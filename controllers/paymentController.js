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

  // Fetch the active subscription of the user
  const activeSubscription = await Subscription.findOne({
    where: { admin_id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  if (activeSubscription) {
    const { plan_type: currentPlanType } = activeSubscription;

    // Check if the current subscription is "basic" or "trial"
    if (currentPlanType === 'basic' || currentPlanType === 'trial') {
      // Allow user to subscribe to a new plan even with an active "basic" or "trial"
      console.log(`User with basic/trial plan switching to ${plan_type}`);
    } else if (currentPlanType === plan_type) {
      // Extend the current subscription's end date if it's the same plan
      let newEndDate;
      if (duration === 'monthly') {
        newEndDate = addMonths(activeSubscription.end_date, 1);
      } else if (duration === 'yearly') {
        newEndDate = addYears(activeSubscription.end_date, 1);
      }

      // Update subscription with the new end date
      await Subscription.update(
        { end_date: newEndDate },
        { where: { subscription_id: activeSubscription.subscription_id } }
      );

      return res.status(200).json({
        status: 'success',
        message: `Subscription extended until ${newEndDate}`,
      });
    } else {
      // Prevent subscribing to a different plan type without canceling the current subscription
      return res.status(400).json({
        status: 'fail',
        message:
          'You must cancel your current plan before subscribing to a new plan.',
      });
    }
  }

  // No active subscription or user is on "basic" or "trial", proceed with creating a new one
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

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
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
