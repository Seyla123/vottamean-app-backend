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

// Get user
// Get user
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
          {
            model: School,
            as: 'Schools',
            through: { model: SchoolAdmin },
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
                required: false,
              },
            ],
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

  // Extract user data
  const { user_id, email, role, AdminProfile, TeacherProfile } = user.toJSON();

  // Process admin's schools, ensuring no duplicates
  let uniqueAdminSchools = [];
  if (AdminProfile && AdminProfile.Schools) {
    const schoolMap = {};
    AdminProfile.Schools.forEach((school) => {
      if (!schoolMap[school.school_id]) {
        schoolMap[school.school_id] = school;
      }
    });
    uniqueAdminSchools = Object.values(schoolMap);
  }

  // Extract teacher's school from SchoolAdmin
  let teacherSchool = null;
  if (
    TeacherProfile &&
    TeacherProfile.SchoolAdmin &&
    TeacherProfile.SchoolAdmin.School
  ) {
    teacherSchool = TeacherProfile.SchoolAdmin.School;
  }

  // Structure the response based on the user's role
  const userProfile = {
    id: user_id,
    email,
    role,
    adminProfile:
      role === 'admin' && AdminProfile
        ? {
            ...AdminProfile,
            schools: uniqueAdminSchools,
          }
        : null,
    teacherProfile:
      role === 'teacher' && TeacherProfile
        ? {
            teacher_id: TeacherProfile.teacher_id,
            active: TeacherProfile.active,
            createdAt: TeacherProfile.createdAt,
            updatedAt: TeacherProfile.updatedAt,
            info: TeacherProfile.Info,
            school: teacherSchool,
          }
        : null,
  };

  // Send the structured response
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

// Update current login user
exports.updateMe = catchAsync(async (req, res, next) => {
  let user;

  // Check if the user is an Admin or Teacher
  if (req.user.role === 'admin') {
    user = await Admin.findOne({
      where: { user_id: req.user.user_id },
      include: [
        { model: School, as: 'Schools', through: { model: SchoolAdmin } },
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

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const infoId = user.info_id || (user.Info && user.Info.info_id);
  if (!infoId) {
    return next(new AppError('No user information found for this ID', 404));
  }

  // Filter out fields that are not allowed to be updated
  const allowedFields = [
    'first_name',
    'last_name',
    'phone_number',
    'address',
    'dob',
  ];
  const filteredBody = filterObj(req.body, ...allowedFields);

  if (
    filteredBody.dob &&
    !moment(filteredBody.dob, 'YYYY-MM-DD', true).isValid()
  ) {
    return next(
      new AppError('Invalid date format for dob. Please use YYYY-MM-DD.', 400)
    );
  }

  // Set the info_id for the update
  req.params.id = infoId;

  // Logging the payload before update
  console.log('Updating info with payload:', filteredBody);

  // Update the user's info.
  await factory.updateOne(Info, 'info_id')(req, res, next);

  // Update the user's photo if provided
  if (req.file) {
    // Assuming you store the photo URL in the Info model
    await Info.update(
      { photo: req.file.location },
      { where: { info_id: infoId } }
    );
  }

  // Update school information if the user is an Admin and schools exist
  if (req.user.role === 'admin' && user.Schools && user.Schools.length > 0) {
    const school = user.Schools[0];

    const { school_name, school_address, school_phone_number } = req.body;

    // Update the school information only if the respective fields are provided
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
