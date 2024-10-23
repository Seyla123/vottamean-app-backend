const { Admin, Subscription, Teacher, Student, Payment, sequelize } = require('../models');
const AppError = require('./appError');

// Helper function to check subscription limits for teachers and students
const checkLimit = async (school_admin_id, type) => {
  // 1. Find the admin associated with the school admin
  const schoolAdmin = await Admin.findOne({
    where: { admin_id: school_admin_id },
    include: {
      model: Subscription,
      as: 'Subscriptions',
      where: { status: 'active' },
      required: false,
    },
  });

  // If no active subscription is found, throw an error
  if (
    !schoolAdmin ||
    !schoolAdmin.Subscriptions ||
    schoolAdmin.Subscriptions.length === 0
  ) {
    throw new AppError(`You haven’t subscribed yet. Please select a plan to avoid temporary deactivation.`, 403);
  }

  const { plan_type, duration, end_date } = schoolAdmin.Subscriptions[0];

  const today = new Date();
  const isExpired = end_date < today;


  if (isExpired) {
    throw new AppError('Your subscription has expired', 402);
  }

  // 2. Count the number of entities (teachers or students)
  const entityCount =
    type === 'teacher'
      ? await Teacher.count({ where: { school_admin_id, active: true } })
      : await Student.count({ where: { school_admin_id, active: true } });

  // 3. Check plan type and entity limit
  if (plan_type === 'basic' && duration === 'trial') {
    // Basic Free Trial Plan
    const limit = type === 'teacher' ? 5 : 50;

    if (entityCount >= limit) {
      throw new AppError(`Basic Free plan allows only ${limit} ${type}s`, 403);
    }
  } else if (plan_type === 'standard') {
    // Standard Plan (Monthly or Yearly)
    const limit = type === 'teacher' ? 100 : 1000;
    if (entityCount >= limit) {
      throw new AppError(`Standard plan allows only ${limit} ${type}s`, 403);
    }
  } else if (plan_type === 'premium') {
    // Premium Plan (Monthly or Yearly) - No Limits
    return true;
  }

  return true;
};

// Helper function to check teacher limit
exports.checkTeacherLimit = async (school_admin_id) => {
  return await checkLimit(school_admin_id, 'teacher');
};

// Helper function to check student limit
exports.checkStudentLimit = async (school_admin_id) => {
  return await checkLimit(school_admin_id, 'student');
};

// Helper function to get the plan amount
exports.getPlanAmount = (plan_type, duration) => {
  if (plan_type === 'standard' && duration === 'monthly') return 399; // $3.99 in cents
  if (plan_type === 'standard' && duration === 'yearly') return 3999; // $39.99 in cents
  if (plan_type === 'premium' && duration === 'monthly') return 999; // $9.99 in cents
  if (plan_type === 'premium' && duration === 'yearly') return 9999; // $99.99 in cents
  if (duration === 'trial') return 0; // Free trial
  return null;
};

// Helper functions for date manipulation in the payment process
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Helper functions for date manipulation in the payment process
const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

// Helper function to handle checkout session completed
exports.handleCheckoutSessionCompleted = async (session) => {
  const { admin_id, plan_type, duration } = session.metadata;
  const subscriptionId = session.subscription;

  // Fetch the active subscription for the admin
  const activeSubscription = await Subscription.findOne({
    where: { admin_id, status: 'active' },
    order: [['createdAt', 'DESC']],
  });

  let newEndDate;
  let newSubscriptionId;

  if (activeSubscription) {
    const { plan_type: currentPlanType, end_date: currentEndDate } =
      activeSubscription;

    // For non-basic plans, check if they are trying to switch plans
    if (currentPlanType !== plan_type) {
      const transaction = await sequelize.transaction();
      try {
        // If no active subscription, create a new one
        const end_date =
          duration === 'monthly'
            ? addMonths(new Date(), 1)
            : addYears(new Date(), 1);
        // cancel all previuse plans
        await Subscription.update(
          {
            status: 'canceled',
          },
          { where: { admin_id } },
          { transaction }
        );

        // subcribe  new plan
        const newSubscription = await Subscription.create({
          admin_id,
          plan_type: plan_type,
          duration: duration,
          stripe_subscription_id: subscriptionId,
          start_date: new Date(),
          end_date: end_date,
          status: 'active',
        }, { transaction })

        newSubscriptionId = newSubscription.subscription_id;


        // commit the transaction
        await transaction.commit();
      } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        return console.error(error);
      }
    }
    else {

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
          duration: duration,
        },
        { where: { subscription_id: activeSubscription.subscription_id } }
      );

      newSubscriptionId= activeSubscription.subscription_id

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

    const newSubscription = await Subscription.create({
      admin_id,
      plan_type,
      duration,
      stripe_subscription_id: subscriptionId,
      start_date: new Date(),
      end_date,
      status: 'active',
    });
    newSubscriptionId= newSubscription.subscription_id;

    console.log(`New subscription created for admin_id: ${admin_id}`);
  }
  // Record the payment
  await Payment.create({
    admin_id,
    subscription_id: newSubscriptionId,
    amount: (session.amount_total / 100).toFixed(2),
    payment_method: session.payment_method_types[0],
    payment_status: 'successful',
  });

  console.log(`Payment recorded for admin_id: ${admin_id}`);
};

exports.handlePaymentFailed = async (session) => {
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
