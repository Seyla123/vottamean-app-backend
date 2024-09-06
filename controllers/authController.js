const {
  sequelize,
  User,
  Info,
  Admin,
  School,
  SchoolAdmin,
} = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const Email = require('../utils/email');

// Function to sign a JWT token for the user
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, // Token expiration time
  });
};

// Function to create and send the JWT token as a cookie in the response
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.user_id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents access to the cookie via JavaScript
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Ensures the cookie is sent over HTTPS
  });

  user.password = undefined; // Hide the password from the output

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      id: user.user_id,
      email: user.email,
      role: user.role, // Include additional user data as needed
    },
  });
};

// Signup function
exports.signup = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    passwordConfirm,
    address,
    dob,
    first_name,
    last_name,
    phone_number,
    school_name,
    school_address,
    school_phone_number,
  } = req.body;

  // Check if passwords match
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Validate date of birth format
  const formattedDob = new Date(dob);
  if (isNaN(formattedDob.getTime())) {
    return next(new AppError('Invalid date format for Date of Birth', 400));
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Create a temporary JWT that contains the user data and hashed verification token
  const tempToken = jwt.sign(
    {
      email,
      password,
      address,
      dob: formattedDob,
      first_name,
      last_name,
      phone_number,
      school_name,
      school_address,
      school_phone_number,
      emailVerificationToken: hashedToken, // Include the hashed token for verification
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '10m' } // Default to 10 minutes
  );

  // Send the verification email with the plain (unhashed) token
  const verificationUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/verifyEmail/${verificationToken}?token=${tempToken}`;
  const verificationEmail = new Email({ email }, verificationUrl);

  await verificationEmail.sendVerification();

  res.status(200).json({
    status: 'success',
    message:
      'Verification email sent. Please verify your email to complete registration.',
    token: tempToken, // Return the token to be used later for verification
  });
});

// Verify email handler
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // Hash the token from the URL parameters
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Get the JWT token from the query parameters
  const tempToken = req.query.token;

  // Verify the JWT and decode it
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(tempToken, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // Check if the hashed token matches the one in the decoded JWT
  if (decoded.emailVerificationToken !== hashedToken) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // Begin the transaction
  const transaction = await sequelize.transaction();

  try {
    // Extract user and school information from the decoded JWT
    const {
      email,
      password,
      address,
      dob,
      first_name,
      last_name,
      phone_number,
      school_name,
      school_address,
      school_phone_number,
    } = decoded;

    // Create the user, school, and related entities within a transaction
    const user = await User.create(
      {
        email,
        password,
        emailVerified: true, // Mark the email as verified
      },
      { transaction }
    );

    await Info.create(
      {
        user_id: user.user_id,
        first_name,
        last_name,
        phone_number,
        address,
        dob,
      },
      { transaction }
    );

    const school = await School.create(
      {
        school_name,
        school_address,
        school_phone_number,
      },
      { transaction }
    );

    const admin = await Admin.create(
      { user_id: user.user_id },
      { transaction }
    );

    await SchoolAdmin.create(
      { admin_id: admin.admin_id, school_id: school.school_id },
      { transaction }
    );

    // Commit the transaction after successful creation
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Email verified and account created successfully!',
    });
  } catch (err) {
    // Rollback the transaction if something goes wrong
    await transaction.rollback();
    return next(new AppError('Failed to create user and school', 500));
  }
});

