// Helper function to check subscription and teacher limit
exports.checkTeacherLimit = async (school_admin_id) => {
  // 1. Find the admin associated with the school admin
  const schoolAdmin = await Admin.findOne({
    where: { admin_id: school_admin_id },
    include: {
      model: Subscription,
      as: 'Subscription',
      where: { status: 'active' },
    },
  });

  if (!schoolAdmin) {
    throw new AppError('No active subscription found for this admin', 403);
  }

  const { plan_type } = schoolAdmin.Subscription;

  // 2. Count how many teachers are already created for this school admin
  const teacherCount = await Teacher.count({
    where: { school_admin_id },
  });

  // 3. Check plan type and teacher limit
  if (plan_type === 'free' && teacherCount >= 5) {
    throw new AppError('Free plan allows only 5 teachers', 403);
  }

  // Unlimited for paid plans
  return true;
};
