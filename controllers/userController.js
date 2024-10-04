// Database Models
const {
  User,
  Admin,
  Teacher,
  School,
  SchoolAdmin,
  Info,
  Sequelize,
  Subscription,
} = require('../models');

// Error Handlers
const { filterObj } = require('../utils/filterObj');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Moment library
const moment = require('moment');

// Factory Handler
const factory = require('./handlerFactory');

// Middleware to get the current logged-in user
exports.getMe = catchAsync(async (req, res, next) => {
  // Set user ID for all requests
  req.params.id = req.user.user_id;
  next(); // Proceed to the next middleware or route handler
});

// Update user details (excluding password)
exports.updateUser = factory.updateOne(User, 'user_id');

// Delete user
exports.deleteUser = factory.deleteOne(User, 'user_id');

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

// ----------------------------
// GET CURRENT LOGIN USER
// ----------------------------
exports.getUser = catchAsync(async (req, res, next) => {
  // Fetch user with related profiles, school data, and subscriptions
  const user = await User.findOne({
    where: { user_id: req.params.id },
    include: [
      {
        model: Admin,
        as: 'AdminProfile',
        include: [
          { model: Info, as: 'Info' },
          {
            model: School,
            as: 'School',
            through: { model: SchoolAdmin },
            required: false,
          },
          {
            model: Subscription,
            as: 'Subscriptions',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: Teacher,
        as: 'TeacherProfile',
        include: [
          { model: Info, as: 'Info' },
          {
            model: SchoolAdmin,
            as: 'SchoolAdmin',
            include: [
              {
                model: School,
                as: 'School',
                required: true,
              },
              {
                model: Admin,
                as: 'Admin',
                include: [
                  {
                    model: Subscription,
                    as: 'Subscriptions',
                  },
                ],
              },
            ],
            where: {
              school_admin_id: Sequelize.col('TeacherProfile.school_admin_id'),
            },
            required: false,
          },
        ],
        required: false,
      },
    ],
  });

  // If no user is found, return error
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Extract subscriptions from AdminProfile or TeacherProfile, ensuring no duplication
  let subscriptions = [];
  if (user.AdminProfile && user.AdminProfile.Subscriptions) {
    subscriptions = user.AdminProfile.Subscriptions;
  } else if (
    user.TeacherProfile &&
    user.TeacherProfile.SchoolAdmin.Admin.Subscriptions
  ) {
    subscriptions = user.TeacherProfile.SchoolAdmin.Admin.Subscriptions;
  }

  // Extract other user data
  const { user_id, email, role, AdminProfile, TeacherProfile } = user.toJSON();

  // Extract school directly from the teacher's SchoolAdmin relation
  const school = TeacherProfile?.SchoolAdmin?.School || null;

  // Structure the response with minimal data and no duplication
  const userProfile = {
    id: user_id,
    email,
    role,
    subscriptions, // Only include the root level subscriptions
    adminProfile:
      role === 'admin' && AdminProfile
        ? { ...AdminProfile, Subscriptions: undefined }
        : null, // Remove nested Subscriptions
    teacherProfile:
      role === 'teacher' && TeacherProfile
        ? {
            teacher_id: TeacherProfile.teacher_id,
            active: TeacherProfile.active,
            createdAt: TeacherProfile.createdAt,
            updatedAt: TeacherProfile.updatedAt,
            Info: TeacherProfile.Info,
            School: school,
          }
        : null,
  };

  // Send the structured response
  res.status(200).json({
    status: 'success',
    data: userProfile,
  });
});

// ----------------------------
// UPDATE CURRENT LOGIN USER
// ----------------------------
exports.updateMe = catchAsync(async (req, res, next) => {
  let user;

  // Check if the user is an Admin or Teacher
  if (req.user.role === 'admin') {
    user = await Admin.findOne({
      where: { user_id: req.user.user_id },
      include: [
        { model: School, as: 'School', through: { model: SchoolAdmin } },
      ],
    });
  } else if (req.user.role === 'teacher') {
    user = await Teacher.findOne({
      where: { user_id: req.user.user_id },
      include: [{ model: Info, as: 'Info' }],
    });
  } else {
    return next(new AppError('Invalid user role', 403));
  }

  // Handle case where no user is found
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Get the info ID for the user
  const infoId = user.info_id || (user.Info && user.Info.info_id);
  if (!infoId) {
    return next(new AppError('No user information found for this ID', 404));
  }

  // Allowed fields for personal information update
  const allowedFields = [
    'first_name',
    'last_name',
    'phone_number',
    'address',
    'dob',
    'gender',
  ];

  // Filter the body to only include allowed fields
  const filteredBody = filterObj(req.body, ...allowedFields);

  // Validate date of birth format (if provided)
  if (
    filteredBody.dob &&
    !moment(filteredBody.dob, 'YYYY-MM-DD', true).isValid()
  ) {
    return next(
      new AppError('Invalid date format for dob. Please use YYYY-MM-DD.', 400)
    );
  }

  // Log the filtered body for verification
  console.log('Filtered Body:', filteredBody);

  // Check if there's any update to user information
  const hasUpdates = Object.keys(filteredBody).length > 0;

  // If there are changes to user information, update them
  if (hasUpdates) {
    req.params.id = infoId;
    await factory.updateOne(Info, 'info_id')(req, res, next);
  }

  // Independent check for file (photo) upload
  if (req.file) {
    console.log('Uploaded file:', req.file.location);

    // Update photo URL in the Info model
    const updateResult = await Info.update(
      { photo: req.file.location },
      { where: { info_id: infoId } }
    );
    console.log('Photo update result:', updateResult);

    // Send response if only the photo was updated
    if (!hasUpdates) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile photo updated successfully',
      });
    }
  }

  // Additional logic for Admin to update school information
  if (req.user.role === 'admin') {
    if (user.School && user.School.length > 0) {
      const school = user.School[0];

      // Extract school-related fields from the request body
      const { school_name, school_address, school_phone_number } = req.body;

      // Update the school information if provided
      if (school_name || school_address || school_phone_number) {
        await School.update(
          {
            school_name: school_name || school.school_name,
            school_address: school_address || school.school_address,
            school_phone_number:
              school_phone_number || school.school_phone_number,
          },
          { where: { school_id: school.school_id } }
        );
      }
    }
  }

  // Prevent teachers from updating any school data
  if (
    req.user.role === 'teacher' &&
    (req.body.school_name ||
      req.body.school_address ||
      req.body.school_phone_number)
  ) {
    return next(
      new AppError(
        'Teachers are not allowed to update school information.',
        403
      )
    );
  }

  // Send final response after completing all updates
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
  });
});

// Delete current login user
exports.deleteMe = catchAsync(async (req, res, next) => {
  // Get the currently logged-in user ID from the token
  const user_id = req.user.user_id;

  // Use the factory deleteOne method but pass the user ID from the token
  req.params.id = user_id;

  // Call the factory deleteOne function
  factory.deleteOne(User, 'user_id')(req, res, next);
});

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
