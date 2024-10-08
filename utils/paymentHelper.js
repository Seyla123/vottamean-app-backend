const { Admin, Subscription, Teacher, Student } = require('../models');
const AppError = require('./appError');
const { Op } = require('sequelize');

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
    throw new AppError('No active subscription found for this admin', 403);
  }

  const { plan_type } = schoolAdmin.Subscriptions[0];

  // 2. Count the number of entities (teachers or students)
  const entityCount =
    type === 'teacher'
      ? await Teacher.count({ where: { school_admin_id } })
      : await Student.count({ where: { school_admin_id } });

  // 3. Check plan type and entity limit
  if (plan_type === 'free') {
    const limit = type === 'teacher' ? 5 : 50;
    if (entityCount >= limit) {
      throw new AppError(`Free plan allows only ${limit} ${type}s`, 403);
    }
  }

  // Unlimited for paid plans
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

// Helper function to check if an admin has an active subscription
exports.checkActiveSubscription = async (admin_id, newPlanType) => {
  const activeSubscription = await Subscription.findOne({
    where: {
      admin_id: admin_id,
      status: 'active',
      end_date: {
        [Op.gt]: new Date(),
      },
    },
  });

  // If no active subscription is found, allow the subscription
  if (!activeSubscription) {
    return false;
  }

  // Check the type of the current active subscription
  const currentPlanType = activeSubscription.plan_type;

  // If the user has a free plan and is upgrading, allow the upgrade
  if (
    currentPlanType === 'free' &&
    (newPlanType === 'monthly' || newPlanType === 'yearly')
  ) {
    // No error, allow the new subscription
    return false;
  }

  // If the user has a paid plan (monthly or yearly), they need to cancel it first
  if (
    (currentPlanType === 'monthly' || currentPlanType === 'yearly') &&
    newPlanType !== currentPlanType
  ) {
    throw new AppError(
      `You already have an active ${currentPlanType} subscription. Please cancel it before purchasing a new ${newPlanType} plan.`,
      400
    );
  }

  // No need to cancel the same paid plan type (monthly -> monthly or yearly -> yearly)
  return false;
};

// Helper functions for date manipulation in the payment process
exports.addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

exports.addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};
