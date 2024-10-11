const stripe = require('../config/stripe');
const { Subscription, Payment, Admin } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { addMonths, addYears } = require('../utils/paymentHelper');

// -----------------------------------
// GET ALL SUBSCRIPTION PLANS
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
    data: { subscriptions },
  });
});

// -----------------------------------
// GET ALL PAYMENTS
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
    data: { payments },
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

  if (activeSubscription.plan_type === 'basic') {
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

    if (currentPlanType === plan_type) {
      // Handle extending the current subscription after Stripe payment is successful
      const amount = getPlanAmount(plan_type, duration);
      if (!amount)
        return next(new AppError('Invalid plan type or duration', 400));

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
            isExtension: true, // Flag to indicate an extension
          },
        });

        res.status(200).json({ status: 'success', url: session.url });
      } catch (error) {
        return next(new AppError(error.message, 400));
      }
    } else {
      return res.status(400).json({
        status: 'fail',
        message:
          'You must cancel your current plan before subscribing to a new plan.',
      });
    }
  }

  // Proceed with a new subscription creation if no active subscription
  const amount = getPlanAmount(plan_type, duration);
  if (!amount) return next(new AppError('Invalid plan type or duration', 400));

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
        isExtension: false, // For new subscription
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
  if (plan_type === 'standard' && duration === 'monthly') return 3.99 * 100; // $3.99 monthly
  if (plan_type === 'standard' && duration === 'yearly') return 39.99 * 100; // $39.99 yearly
  if (plan_type === 'premium' && duration === 'monthly') return 9.99 * 100; // $9.99 monthly
  if (plan_type === 'premium' && duration === 'yearly') return 99.99 * 100; // $99.99 yearly
  if (duration === 'trial') return 0; // Free trial
  return null; // Invalid plan type or duration
};

const handleCheckoutSessionCompleted = async (session) => {
  const { admin_id, plan_type, duration, isExtension } = session.metadata;

  if (isExtension) {
    const activeSubscription = await Subscription.findOne({
      where: { admin_id, status: 'active' },
      order: [['createdAt', 'DESC']],
    });

    if (activeSubscription && activeSubscription.plan_type === plan_type) {
      // Calculate new end date
      let newEndDate;
      if (duration === 'monthly') {
        newEndDate = addMonths(activeSubscription.end_date, 1);
      } else if (duration === 'yearly') {
        newEndDate = addYears(activeSubscription.end_date, 1);
      }

      // Update the subscription's end date
      await Subscription.update(
        { end_date: newEndDate },
        { where: { subscription_id: activeSubscription.subscription_id } }
      );
    }
  } else {
    // Handle new subscription creation
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    await Subscription.create({
      admin_id,
      plan_type,
      stripe_subscription_id: subscription.id,
      start_date: new Date(),
      end_date:
        duration === 'monthly'
          ? addMonths(new Date(), 1)
          : addYears(new Date(), 1),
      status: 'active',
    });

    // Record the payment
    await Payment.create({
      admin_id,
      stripe_payment_id: session.payment_intent,
      amount: subscription.plan.amount,
      currency: subscription.plan.currency,
      status: 'succeeded',
    });
  }
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
