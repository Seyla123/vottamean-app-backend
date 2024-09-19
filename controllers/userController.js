// Database Models
const {
  User,
  Admin,
  Teacher,
  School,
  SchoolAdmin,
  Info,
} = require('../models');

// Error Handlers
const { filterObj } = require('../utils/filterObj');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory Handler
const factory = require('./handlerFactory');

// Middleware to get the current logged-in user
exports.getMe = catchAsync(async (req, res, next) => {
  // Set user ID for all requests
  req.params.id = req.user.user_id;
  next(); // Proceed to the next middleware or route handler
});

// Update current user details (excluding password)
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /change-password.',
        400
      )
    );
  }

  // 2) Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Handle photo upload if it exists
  if (req.file && req.file.location) {
    filteredBody.photo = req.file.location;
  }

  // 4) Update user record
  const [numAffectedRows, updatedUser] = await User.update(filteredBody, {
    where: { user_id: req.user.id },
    returning: true,
    plain: true,
  });

  if (numAffectedRows === 0) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Get one User
exports.getUser = catchAsync(async (req, res, next) => {
  // Fetch user with related profiles and school data
  const user = await User.findOne({
    where: { user_id: req.params.id },
    include: [
      {
        model: Admin,
        as: 'AdminProfile',
        include: [
          { model: Info, as: 'Info' },
          { model: School, as: 'Schools', through: { model: SchoolAdmin } },
        ],
        required: false,
      },
      {
        model: Teacher,
        as: 'TeacherProfile',
        include: [{ model: Info, as: 'Info' }],
        required: false,
      },
    ],
  });

  // If no user is found, return error
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Avoid circular reference and structure data
  const { user_id, email, role, AdminProfile, TeacherProfile } = user.toJSON();

  // Structure response based on role
  const userProfile = {
    id: user_id,
    email,
    role,
    adminProfile:
      role === 'admin' && AdminProfile
        ? {
            ...AdminProfile,
            schools: AdminProfile.Schools || null,
          }
        : null,
    teacherProfile: (role === 'teacher' && TeacherProfile) || null,
  };

  // Send response
  res.status(200).json({
    status: 'success',
    data: userProfile,
  });
});

// Get all Users
exports.getAllUsers = factory.getAll(User, {}, [
  {
    model: Admin,
    as: 'AdminProfile',
    include: [{ model: Info, as: 'Info' }],
  },
  {
    model: Teacher,
    as: 'TeacherProfile',
    include: [{ model: Info, as: 'Info' }],
  },
]);

// Update user details (excluding password)
exports.updateUser = factory.updateOne(User, 'user_id');

// Delete user
exports.deleteUser = factory.deleteOne(User, 'user_id');
