// Encryption Library
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
// Database Models
const { Teacher, Info, sequelize, User } = require('../models');

// Helper funciton
const { isBelongsToAdmin } = require('../utils/helper');
const { checkTeacherLimit } = require('../utils/paymentHelper');

// Validators
const {
  isValidEmail,
  isValidPassword,
  isPasswordConfirm,
  isValidDOB,
  isValidName,
  isValidPhoneNumber,
  isValidAddress,
  isValidGender,
} = require('../validators/infoValidator');

// Email Handlers
const {
  sendVerificationEmail,
  createVerificationToken,
} = require('../utils/authUtils');

// Error Handlers
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory Handler
const factory = require('./handlerFactory');

// Get one teacher
exports.getTeacher = catchAsync(async (req, res, next) => {
  // Find the teacher by primary key and include the User model
  const teacher = await Teacher.findOne({
    where: {
      teacher_id: req.params.id,
      school_admin_id: req.school_admin_id,
      active: true,
    },
    include: [
      {
        model: User,
        as: 'User',
      },
      {
        model: Info,
        as: 'Info',
      },
    ],
  });

  if (!teacher) {
    return next(new AppError('Teacher not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: teacher,
  });
});

// Get all teachers
exports.getAllTeachers = catchAsync(async (req, res, next) => {
  const search = req.query.search;
  const associated = [
    {
      model: User,
      as: 'User',
    },
    {
      model: Info,
      as: 'Info',
      where: search && {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
        ],
      },
    },
  ];

  factory.getAll(
    Teacher,
    { school_admin_id: req.school_admin_id },
    associated,
    []
  )(req, res, next);
});

exports.updateTeacher = catchAsync(async (req, res, next) => {
  // 1. Check if the teacher belongs to the admin
  await isBelongsToAdmin(
    req.params.id,
    'teacher_id',
    req.school_admin_id,
    Teacher
  );

  // 2. Find the teacher by primary key
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) {
    return next(new AppError('Teacher not found', 404));
  }

  // 3. Find the Info record related to the teacher
  const info = await Info.findByPk(teacher.info_id);
  if (!info) {
    return next(new AppError('Teacher info not found', 404));
  }

  // 4. Extract necessary fields from the request body
  const { first_name, last_name, gender, phone_number, dob, address } =
    req.body;

  // 5. Handle photo field
  let photo = info.photo; // Default to current photo

  if (req.file) {
    // New photo uploaded
    photo = req.file.location;
  } else if (req.body.remove_photo === 'true') {
    // Photo was removed
    photo = null;
  } else if (req.body.existing_photo) {
    // Keep existing photo
    photo = req.body.existing_photo;
  }

  // 6. Filter out allowed fields for the update
  const updatedFields = {
    first_name,
    last_name,
    gender,
    phone_number,
    dob,
    address,
    photo,
  };
  // 7. Update the Info record
  await Info.update(updatedFields, { where: { info_id: teacher.info_id } });
  // 8. Retrieve the updated Info record
  const updatedInfo = await Info.findByPk(teacher.info_id);

  res.status(200).json({
    status: 'success',
    message: 'Teacher info updated successfully',
    data: { info: updatedInfo },
  });
});

// Delete teacher
exports.deleteTeacher = catchAsync(async (req, res, next) => {
  // Find the teacher by teacher_id and school_admin_id
  const teacher = await Teacher.findOne({
    where: {
      teacher_id: req.params.id,
      school_admin_id: req.school_admin_id,
      active: true,
    },
  });

  if (!teacher) {
    return next(new AppError('Teacher not found', 404));
  }

  // Find the user record related to the teacher
  const user = await User.findByPk(teacher.user_id);
  if (!user) {
    return next(new AppError('Teacher account not found', 404));
  }

  // Begin a transaction
  const transaction = await sequelize.transaction();
  try {
    // Update the teacher to set active to false
    await Teacher.update(
      { active: false }, // Set active to false
      { where: { teacher_id: req.params.id }, transaction }
    );

    // Update the user to set active to false
    await User.update(
      { active: false }, // Set active to false
      { where: { user_id: teacher.user_id }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Teacher deleted successfully',
      data: teacher,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    return next(
      new AppError(`Failed to delete teacher: ${error.message}`, 500)
    );
  }
});

// ----------------------------
// SIGNUP FUNCTION FOR TEACHERS
// ----------------------------
exports.signupTeacher = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;

  // 1. Check the subscription plan and teacher limit
  try {
    await checkTeacherLimit(school_admin_id);
  } catch (error) {
    return next(error);
  }

  // 2. Extract necessary fields from the request body
  const {
    email,
    password,
    passwordConfirm,
    address,
    dob,
    first_name,
    last_name,
    gender,
    phone_number,
  } = req.body;

  // add photo
  const photo = req.file ? req.file.location : null;

  // 3. Validate input fields using custom validators
  try {
    isValidEmail(email);
    isValidPassword(password);
    isPasswordConfirm(passwordConfirm, password);
    isValidDOB(dob);
    isValidName(first_name);
    isValidName(last_name);
    isValidGender(gender);
    isValidPhoneNumber(phone_number);
    isValidAddress(address);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }

  // 4. Check if the email is already registered.
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser && existingUser.emailVerified) {
    return next(new AppError('Email is already registered', 400));
  }

  // 5. If the user exists but is not verified, allow re-verification.
  if (existingUser && !existingUser.emailVerified) {
    const { token: verificationToken, hashedToken } = createVerificationToken();

    // Create a temporary JWT token with user data and the hashed verification token.
    const tempToken = jwt.sign(
      {
        email,
        password,
        address,
        dob: new Date(dob),
        first_name,
        last_name,
        gender,
        phone_number,
        school_admin_id,
        emailVerificationToken: hashedToken,
      },
      process.env.JWT_SECRET
    );

    const verificationUrl =
      `${req.headers.origin}/auth/verify-teacher-email/${verificationToken}?token=${tempToken}` ||
      `http://localhost:5173/auth/verify-teacher-email/${verificationToken}?token=${tempToken}`;
    try {
      await sendVerificationEmail(email, verificationUrl, first_name);

      existingUser.verificationRequestedAt = new Date();
      existingUser.emailVerificationToken = hashedToken;
      await existingUser.save();

      return res.status(200).json({
        status: 'success',
        message:
          'Re-sent verification email. Please verify to complete registration.',
      });
    } catch (error) {
      return next(new AppError('Failed to send verification email', 500));
    }
  }

  // 7. Generate a verification token and send the email
  const { token: verificationToken, hashedToken } = createVerificationToken();

  // 6. If no existing user, create a new one
  const transaction = await sequelize.transaction();
  let user;
  try {
    user = await User.create(
      {
        email,
        password,
        emailVerified: false,
        emailVerificationToken: hashedToken,
        role: 'teacher',
        verificationRequestedAt: new Date(),
      },
      { transaction }
    );

    const info = await Info.create(
      {
        first_name,
        last_name,
        phone_number,
        address,
        dob: new Date(dob),
        gender,
        photo,
      },
      { transaction }
    );

    await Teacher.create(
      {
        user_id: user.user_id,
        info_id: info.info_id,
        school_admin_id,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    return next(new AppError('Failed to create teacher record', 500));
  }
  const tempToken = jwt.sign(
    {
      email,
      school_admin_id,
      emailVerificationToken: hashedToken,
    },
    process.env.JWT_SECRET
  );

  const verificationUrl =
    `${req.headers.origin}/auth/verify-teacher-email/${verificationToken}?token=${tempToken}` ||
    `http://localhost:5173/auth/verify-teacher-email/${verificationToken}?token=${tempToken}`;

  try {
    await sendVerificationEmail(email, verificationUrl, first_name);
  } catch (error) {
    return next(new AppError('Failed to send verification email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Verification email sent. Please verify to complete registration.',
    token: tempToken,
  });
});

// ----------------------------
// VERIFY EMAIL FUNCTION FOR TEACHERS
// ----------------------------
exports.verifyTeacherEmail = catchAsync(async (req, res, next) => {
  // 1. Extract the token from the URL
  const { token: urlToken } = req.params;

  // 2. Hash the token for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(urlToken)
    .digest('hex');

  // 3. Extract the temporary JWT token from the query string
  const tempToken = req.query.token;

  // 4. Verify the temporary token and extract the decoded data
  const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

  // 5. Find the user using the email and check for matching tokens
  const user = await User.findOne({
    where: { email: decoded.email },
    attributes: ['email', 'emailVerificationToken', 'user_id'],
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 6. Compare the hashed token with the stored token
  if (user.emailVerificationToken !== hashedToken) {
    return next(new AppError('Invalid or expired token.', 400));
  }

  // 7. Update user to verified status
  user.emailVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully! Your account is now active.',
  });
});

// ----------------------------
// SEND INVITATION TO TEACHER
// ----------------------------
exports.sendInvitationToTeacher = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  const { email, address, dob, first_name, last_name, gender, phone_number } =
    req.body;

  // 1. Check the subscription plan and teacher limit
  try {
    await checkTeacherLimit(school_admin_id);
  } catch (error) {
    return next(error);
  }

  // 2. Validate input fields using custom validators
  try {
    isValidEmail(email);
    isValidDOB(dob);
    isValidName(first_name);
    isValidName(last_name);
    isValidGender(gender);
    isValidPhoneNumber(phone_number);
    isValidAddress(address);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }

  // 3. Check if the email is already registered
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser && existingUser.emailVerified) {
    return next(new AppError('This email is already registered.', 400));
  }

  // 4. Generate a verification token
  const { token: verificationToken, hashedToken } = createVerificationToken();

  // 5. Create a temporary JWT token containing user data
  const tempToken = jwt.sign(
    {
      email,
      address,
      dob: new Date(dob),
      first_name,
      last_name,
      gender,
      phone_number,
      school_admin_id,
      emailVerificationToken: hashedToken,
    },
    process.env.JWT_SECRET
  );

  // 6. Construct the verification URL
  const verificationUrl =
    `http://localhost:5173/auth/complete-registration/${verificationToken}?token=${tempToken}` ||
    `${req.headers.origin}/auth/complete-registration/${verificationToken}?token=${tempToken}`;

  // 7. Send the invitation email
  try {
    await sendVerificationEmail(email, verificationUrl);
    return res.status(200).json({
      status: 'success',
      message:
        'Invitation link sent to the teacher. Please ask them to complete registration.',
    });
  } catch (error) {
    return next(new AppError('Failed to send invitation email', 500));
  }
});

// ----------------------------
// COMPLETE REGISTRATION FOR TEACHER
// ----------------------------
exports.completeRegistration = catchAsync(async (req, res, next) => {
  const { token: urlToken } = req.params;
  const { password, passwordConfirm } = req.body;

  // 1. Validate password and confirm password
  try {
    isValidPassword(password);
    isPasswordConfirm(passwordConfirm, password);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }

  // 2. Hash the verification token for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(urlToken)
    .digest('hex');

  // 3. Extract the temporary JWT token from the query string
  const tempToken = req.query.token;

  // 4. Verify the temporary token and extract the decoded data
  const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

  // 5. Find the user using the email and check for matching tokens
  const user = await User.findOne({
    where: { email: decoded.email },
    attributes: ['email', 'emailVerificationToken', 'user_id'],
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 6. Compare the hashed token with the stored token
  if (user.emailVerificationToken !== hashedToken) {
    return next(new AppError('Invalid or expired token.', 400));
  }

  // 7. Update user to verified status and set the password
  user.emailVerified = true;
  user.password = password;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Registration completed successfully! Your account is now active.',
  });
});

// Delete many teachers
exports.deleteManyTeachers = catchAsync(async (req, res, next) => {
  const idArray = req.body.ids; // Assuming `ids` is sent as an array in the request body

  // Ensure idArray is an array
  if (!Array.isArray(idArray) || idArray.length === 0) {
    return next(new AppError('Invalid or missing teacher IDs', 400));
  }

  // Find all teachers by teacher_ids and school_admin_id
  const teachers = await Teacher.findAll({
    where: {
      teacher_id: idArray,
      school_admin_id: req.school_admin_id,
    },
  });

  if (teachers.length === 0) {
    return next(new AppError('No teachers found', 404));
  }

  // Find all users associated with the teachers
  const userIds = teachers.map((teacher) => teacher.user_id);
  const users = await User.findAll({
    where: {
      user_id: userIds,
    },
  });

  // Check if all users were found
  if (users.length !== userIds.length) {
    return next(new AppError('Some teacher accounts not found', 404));
  }

  // Begin a transaction
  const transaction = await sequelize.transaction();
  try {
    // Update all teachers to set active to false
    await Teacher.update(
      { active: false },
      { where: { teacher_id: idArray }, transaction }
    );

    // Update all users to set active to false
    await User.update(
      { active: false },
      { where: { user_id: userIds }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Teachers deleted successfully',
      data: teachers,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    return next(
      new AppError(`Failed to delete teachers: ${error.message}`, 500)
    );
  }
});

// re-activate the teacher
exports.reactivateTeachers = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  // Find the teacher by primary key
  const teacher = await Teacher.findOne({
    where : {
      teacher_id : id,
      school_admin_id : req.school_admin_id
    }
  });
  if (!teacher.user_id) {
    return next(new AppError('Teacher not found', 404));
  }

  // Find the teacher's account 
  const user = await User.findOne({
    where: {
      user_id: teacher.user_id,
    }
  });
  if (!user) {
    return next(new AppError('Teacher account not found', 404));
  }
  req.params.id = teacher.user_id;
  factory.restoreOne(User, 'user_id')(req, res, next);
});
