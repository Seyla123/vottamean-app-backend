const { Admin, Subscription, Teacher } = require('../models');
const AppError = require('./appError');
const { Op } = require('sequelize');

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

// Helper function to check subscription and teacher limit
exports.checkTeacherLimit = async (school_admin_id) => {
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

  // 2. Count how many teachers are already created for this school admin
  const teacherCount = await Teacher.count({
    where: { school_admin_id },
  });

  // 3. Check plan type and teacher limit
  if (plan_type === 'free' && teacherCount >= 1) {
    throw new AppError('Free plan allows only 5 teachers', 403);
  }

  // Unlimited for paid plans
  return true;
};

// Helper function to check if an admin has an active subscription
exports.checkActiveSubscription = async (admin_id) => {
  const activeSubscription = await Subscription.findOne({
    where: {
      admin_id: admin_id,
      status: 'active',
      end_date: {
        [Op.gt]: new Date(), // Ensure the subscription has not expired
      },
    },
  });

  // If an active subscription is found, throw an error
  if (activeSubscription) {
    throw new AppError(
      'You already have an active subscription. Please cancel it before purchasing a new plan.',
      400
    );
  }

  // No active subscription found
  return false;
};
