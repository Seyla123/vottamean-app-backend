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

// Update current user details (excluding password)
exports.updateMe = catchAsync(async (req, res, next) => {
  // // Handle photo upload
  // if (req.file && req.file.location) {
  //   filteredBody.photo = req.file.location;
  // }
  const user = await Admin.findOne({ where: { user_id: req.user.user_id } });
  if (!user) {
    return new AppError('No user found with that ID', 404);
  }
  req.params.id = user.info_id;
  factory.updateOne(Info, 'info_id')(req, res, next);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // Get the currently logged-in user ID from the token
  const user_id = req.user.user_id;

  // Use the factory deleteOne method but pass the user ID from the token
  req.params.id = user_id;

  // Call the factory deleteOne function
  factory.deleteOne(User, 'user_id')(req, res, next);
});

// Update user details (excluding password)
exports.updateUser = factory.updateOne(User, 'user_id');

// Delete user
exports.deleteUser = factory.deleteOne(User, 'user_id');

// Restore user by user ID
exports.restoreUser = catchAsync(async (req, res, next) => {
  // Get the user ID from the request parameters
  const user_id = req.params.id;

  // Log the operation
  console.log(`Attempting to restore user with user_id: ${user_id}`);

  // Use the factory restoreOne method
  req.params.id = user_id;

  // Call the factory restoreOne function
  factory.restoreOne(User, 'user_id')(req, res, next);
});
