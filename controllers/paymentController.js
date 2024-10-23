const stripe = require('../config/stripe');
const { Subscription, Payment, Admin, SchoolAdmin } = require('../models');
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
  const adminId = req.admin_id;

  const activeSubscription = await Subscription.findOne({
    where: { admin_id : adminId, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  if (!activeSubscription) {
    return res.status(400).json({
      status: 'fail',
      message: 'No active subscription found to cancel.',
    });
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

// Check if admin exists
exports.checkAdminExists = async (req, res, next) => {
  const school_admin_id = req.school_admin_id;

  const schoolAdminId  = await SchoolAdmin.findOne({
    where: { school_admin_id: school_admin_id },
    attributes: ['admin_id'],
  });
  if (!schoolAdminId) {
    return res.status(400).json({
      status: 'fail',
      message: 'could not find school admin',
    });
  }
  req.admin_id = schoolAdminId.admin_id;
  
  if (!req.admin_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'could not find this admin id',
    });
  }
  next();
};

// -----------------------------------
// CREATE CHECKOUT SESSION : Stripe UI
// -----------------------------------
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { plan_type, duration } = req.body;
  const adminId  = req.admin_id;

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
        admin_id:adminId,
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
// -----------------------------------
// GET CHECKOUT SESSION DETAILS
// -----------------------------------
exports.getCheckoutSession = catchAsync(async (req, res, next) => {

  // Retrieve the session ID from the request parameters
  const sessionId = req.params.id;

  // Retrieve the checkout session details from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // Calculate the date of the checkout session
  const date = new Date(session.created * 1000);
  
  // Send a JSON response with the checkout session details
  res.status(200).json({
    status: 'success',
    data: {
      sessionId: session.id,
      totalAmount: session.amount_total / 100,
      customerEmail: session.customer_details.email,
      planType: session.metadata,
      subscriptionId: session.subscription,
      paymentStatus: session.payment_status,
      date
    },
  });
})
