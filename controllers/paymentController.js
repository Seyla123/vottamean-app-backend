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

// ----------------------------
// HELPER FUNCTIONS
// ----------------------------
const getPlanAmount = (plan_type, duration) => {
  if (plan_type === 'standard' && duration === 'monthly') return 399; // $3.99 in cents
  if (plan_type === 'standard' && duration === 'yearly') return 3999; // $39.99 in cents
  if (plan_type === 'premium' && duration === 'monthly') return 999; // $9.99 in cents
  if (plan_type === 'premium' && duration === 'yearly') return 9999; // $99.99 in cents
  if (duration === 'trial') return 0; // Free trial
  return null;
};

const handleCheckoutSessionCompleted = async (session) => {
  const { admin_id, plan_type, duration } = session.metadata;
  const subscriptionId = session.subscription;

  // Fetch the active subscription for the admin
  const activeSubscription = await Subscription.findOne({
    where: { admin_id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  let newEndDate;
  let newSubscription;

  if (activeSubscription) {
    const { plan_type: currentPlanType, end_date: currentEndDate } =
      activeSubscription;

    // If current plan is basic, create a new subscription without extending the existing one
    if (currentPlanType === 'basic') {
      console.log(
        `Admin with admin_id: ${admin_id} is currently on the basic plan. Creating a new subscription for the ${plan_type} plan.`
      );

      // Create a new subscription with the new plan type
      const end_date =
        duration === 'monthly'
          ? addMonths(new Date(), 1)
          : addYears(new Date(), 1);

      newSubscription = await Subscription.create({
        admin_id,
        plan_type,
        duration,
        stripe_subscription_id: subscriptionId,
        start_date: new Date(),
        end_date,
        status: 'active',
      });

      console.log(
        `New subscription created for admin_id: ${admin_id} with plan type: ${plan_type}`
      );
    } else {
      // For non-basic plans, check if they are trying to switch plans
      if (currentPlanType !== plan_type) {
        return console.error(
          `Admin with admin_id: ${admin_id} is currently on the ${currentPlanType} plan. They must cancel this plan before switching to ${plan_type}.`
        );
      }

      // Extend the current subscription based on duration
      if (duration === 'monthly') {
        newEndDate = addMonths(currentEndDate, 1);
      } else if (duration === 'yearly') {
        newEndDate = addYears(currentEndDate, 1);
      }

      // Update the existing subscription with the new end date and Stripe subscription ID
      await Subscription.update(
        {
          end_date: newEndDate,
          stripe_subscription_id: subscriptionId,
        },
        { where: { subscription_id: activeSubscription.subscription_id } }
      );

      console.log(
        `Subscription extended for admin_id: ${admin_id} until ${newEndDate}`
      );
    }
  } else {
    // If no active subscription, create a new one
    const end_date =
      duration === 'monthly'
        ? addMonths(new Date(), 1)
        : addYears(new Date(), 1);

    newSubscription = await Subscription.create({
      admin_id,
      plan_type,
      duration,
      stripe_subscription_id: subscriptionId,
      start_date: new Date(),
      end_date,
      status: 'active',
    });

    console.log(`New subscription created for admin_id: ${admin_id}`);
  }

  // Record the payment
  await Payment.create({
    admin_id,
    subscription_id: activeSubscription
      ? activeSubscription.subscription_id
      : newSubscription.subscription_id,
    amount: (session.amount_total / 100).toFixed(2),
    payment_method: session.payment_method_types[0],
    payment_status: 'successful',
  });

  console.log(`Payment recorded for admin_id: ${admin_id}`);
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
