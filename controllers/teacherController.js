// Encryption Library
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Database Models
const { Teacher, Info, sequelize, User } = require('../models');

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
exports.getTeacher = factory.getOne(Teacher, 'teacher_id', [
  {
    model: Info,
    as: 'Info',
  },
]);

// Get all teachers
exports.getAllTeachers = factory.getAll(Teacher, {}, [
  {
    model: Info,
    as: 'Info',
  },
]);

// Update teacher
exports.updateTeacher = factory.updateOne(Teacher, 'teacher_id');

// Delete teacher
exports.deleteTeacher = factory.deleteOne(Teacher, 'teacher_id');

// ----------------------------
// SIGNUP FUNCTION FOR TEACHERS
// ----------------------------
exports.signupTeacher = catchAsync(async (req, res, next) => {
  // 1. Extract necessary fields from the request body.
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
    school_admin_id,
  } = req.body;

  // 2. Validate input fields using custom validators
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

  // 3. Check if the email is already registered.
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  // 4. Generate a verification token and its hashed version.
  const { token: verificationToken, hashedToken } = createVerificationToken();

  // 5. Create a temporary JWT token with user data and the hashed verification token.
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
    process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '10m' }
  );

  // 6. Construct the verification URL and send it via email.
  // const verificationUrl = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/teachers/verify-email/teacher/${verificationToken}?token=${tempToken}`;
  const verificationUrl = `http://localhost:5173/auth/verify-email/${verificationToken}?token=${tempToken}`;

  try {
    await sendVerificationEmail(email, verificationUrl);
  } catch (error) {
    return next(new AppError('Failed to send verification email', 500));
  }

  // 7. Respond with a success message and the temporary token.
  res.status(200).json({
    status: 'success',
    message:
      'Verification email sent. Please verify your email to complete registration.',
    token: tempToken,
  });
});

// ----------------------------
// VERIFY EMAIL FUNCTION FOR TEACHERS
// ----------------------------
exports.verifyTeacherEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const tempToken = req.query.token;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    // Check if the hashed tokens match
    if (decoded.emailVerificationToken !== hashedToken) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    // Destructure the required values from the decoded token
    const {
      email,
      password,
      address,
      dob,
      gender,
      first_name,
      last_name,
      phone_number,
      school_admin_id,
    } = decoded;

    // Validate the necessary fields are present
    if (!email || !password || !first_name || !last_name || !school_admin_id) {
      return next(new AppError('Missing required user information.', 400));
    }

    const transaction = await sequelize.transaction();

    try {
      // Create the User
      const user = await User.create(
        { email, password, emailVerified: true, role: 'teacher' },
        { transaction }
      );

      // Create the Info record
      const info = await Info.create(
        { first_name, last_name, phone_number, address, dob, gender },
        { transaction }
      );

      // Create the Teacher record
      await Teacher.create(
        {
          user_id: user.user_id,
          info_id: info.info_id,
          school_admin_id,
        },
        { transaction }
      );

      // Commit the transaction if all operations are successful
      await transaction.commit();

      res.status(200).json({
        status: 'success',
        message: 'Email verified and teacher account created successfully!',
      });
    } catch (err) {
      // Rollback the transaction in case of any error
      await transaction.rollback();
      console.error('Transaction Error:', err);
      return next(new AppError('Failed to create teacher account', 500));
    }
  } catch (err) {
    // Handle token verification error
    console.error('JWT Error:', err);
    return next(new AppError('Failed to verify token', 400));
  }
});
