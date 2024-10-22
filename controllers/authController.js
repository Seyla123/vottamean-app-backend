// Encryption Library
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Database Models
const {
  sequelize,
  User,
  Info,
  Admin,
  School,
  SchoolAdmin,
  Teacher,
  Subscription,
} = require('../models');
const { Op } = require('sequelize');

// Validators
const {
  isValidEmail,
  isValidPassword,
  isPasswordConfirm,
  isValidDOB,
  isValidName,
  isValidPhoneNumber,
  isValidGender,
} = require('../validators/infoValidator');

// Error Handlers
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Utils Middleware
const Email = require('../utils/email');
const {
  createVerificationToken,
  sendVerificationEmail,
  createSendToken,
} = require('../utils/authUtils');

// ----------------------------
// SIGNUP FUNCTION
// ----------------------------
exports.signup = catchAsync(async (req, res, next) => {
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
    school_name,
    school_address,
    school_phone_number,
  } = req.body;

  console.log('Received Data:', {
    email,
    password,
    passwordConfirm,
    address,
    dob,
    first_name,
    last_name,
    gender,
    phone_number,
    school_name,
    school_address,
    school_phone_number,
  });

  // 2. Validate input fields using custom validators.
  try {
    isValidEmail(email);
    isValidPassword(password);
    isPasswordConfirm(passwordConfirm, password);
    isValidDOB(dob);
    isValidName(first_name);
    isValidName(last_name);
    isValidGender(gender);
    isValidPhoneNumber(phone_number);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }

  // 3. Check if the email is already registered.
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser && existingUser.emailVerified) {
    return next(new AppError('This email is already registered.', 400));
  }

  // 4. If the user exists but is not verified, always allow a new verification token.
  if (existingUser && !existingUser.emailVerified) {
    // 5. Generate a new verification token and its hashed version.
    const { token: verificationToken, hashedToken } = createVerificationToken();

    // 6. Create a new temporary JWT token with user data and the hashed verification token.
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
        school_name,
        school_address,
        school_phone_number,
        emailVerificationToken: hashedToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '10m' }
    );

    // 7. Construct the verification URL and send it via email.
    const verificationUrl =
      `${req.headers.origin}/auth/verify-email/${verificationToken}?token=${tempToken}` ||
      `http://localhost:5173/auth/verify-email/${verificationToken}?token=${tempToken}`;

    try {
      await sendVerificationEmail(email, verificationUrl);

      // Update the `verificationRequestedAt` field and save the new hashed token.
      existingUser.verificationRequestedAt = new Date();
      existingUser.emailVerificationToken = hashedToken;
      await existingUser.save();
    } catch (error) {
      return next(new AppError('Failed to send verification email', 500));
    }

    // 8. Respond with a success message.
    return res.status(200).json({
      status: 'success',
      message:
        'This email is already registered but not verified. A new verification email has been sent. Please verify your email to complete registration.',
    });
  }

  // 9. If no existing user, create a new user with emailVerified set to false and set verificationRequestedAt to now.
  const { token: verificationToken, hashedToken } = createVerificationToken();

  const newUser = await User.create({
    email,
    password,
    emailVerified: false,
    verificationRequestedAt: new Date(),
    emailVerificationToken: hashedToken,
  });

  // 10. Generate a new temporary JWT token for the new user.
  const tempToken = jwt.sign(
    {
      email: newUser.email,
      password: newUser.password,
      address,
      dob: new Date(dob),
      first_name,
      last_name,
      gender,
      phone_number,
      school_name,
      school_address,
      school_phone_number,
      emailVerificationToken: hashedToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '10m' }
  );

  // 11. Construct the verification URL and send it via email.
  const verificationUrl =
    `${req.headers.origin}/auth/verify-email/${verificationToken}?token=${tempToken}` ||
    `http://localhost:5173/auth/verify-email/${verificationToken}?token=${tempToken}`;

  try {
    await sendVerificationEmail(email, verificationUrl);
  } catch (error) {
    return next(new AppError('Failed to send verification email', 500));
  }

  // 12. Respond with a success message and the temporary token.
  res.status(200).json({
    status: 'success',
    message:
      'Verification email sent. Please verify your email to complete registration.',
    token: tempToken,
  });
});

// ----------------------------
// VERIFY EMAIL FUNCTION
// ----------------------------
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // 1. Extract the token from the URL and log it
  const { token: urlToken } = req.params;

  // 2. Hash the token from the URL for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(urlToken)
    .digest('hex');

  // 3. Extract temporary JWT token from the query
  const tempToken = req.query.token;

  // 4. Decode the temporary JWT token to extract the email
  const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

  // 5. Find the user by the decoded email and include the emailVerificationToken field
  const user = await User.findOne({
    where: { email: decoded.email },
    attributes: ['email', 'emailVerificationToken', 'user_id'],
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 6. Check if the token matches the user's stored verification token
  if (user.emailVerificationToken !== hashedToken) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // 7. Start a transaction for database updates
  const transaction = await sequelize.transaction();

  try {
    // 8. Update the user's email verification status
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save({ transaction });

    // 9. Create the related Info, School, Admin, and SchoolAdmin records
    const info = await Info.create(
      {
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        gender: decoded.gender,
        phone_number: decoded.phone_number,
        address: decoded.address,
        dob: new Date(decoded.dob),
      },
      { transaction }
    );

    const school = await School.create(
      {
        school_name: decoded.school_name,
        school_address: decoded.school_address,
        school_phone_number: decoded.school_phone_number,
      },
      { transaction }
    );

    const admin = await Admin.create(
      {
        user_id: user.user_id,
        info_id: info.info_id,
      },
      { transaction }
    );

    await SchoolAdmin.create(
      {
        admin_id: admin.admin_id,
        school_id: school.school_id,
      },
      { transaction }
    );

    // 10. Create the subscription (basic plan, 14-day trial)
    await Subscription.create(
      {
        admin_id: admin.admin_id,
        plan_type: 'basic',
        start_date: new Date(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      { transaction }
    );

    // 11. Commit the transaction
    await transaction.commit();

    // 12. Respond with success
    res.status(200).json({
      status: 'success',
      message: 'Email verified and account activated successfully!',
    });
  } catch (err) {
    // 13. Rollback the transaction if an error occurs
    await transaction.rollback();
    return next(
      new AppError(
        `Failed to verify email and update user: ${err.message}`,
        500
      )
    );
  }
});

// ----------------------------
// REQUIRE EMAIL VERIFICATION FUNCTION
// ----------------------------
exports.requireEmailVerification = catchAsync(async (req, res, next) => {
  // 1. Check if the user’s email is verified.
  if (!req.user.emailVerified) {
    return next(
      new AppError('Please verify your email to access this resource.', 403)
    );
  }
  // 2. Proceed to the next middleware if email is verified.
  next();
});

// ----------------------------
// LOGIN FUNCTION
// ----------------------------
exports.login = catchAsync(async (req, res, next) => {
  // 1. Extract email and password from the request body.
  const { email, password } = req.body;

  // 2. Ensure both email and password are provided.
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 3. Find the user by email and verify the password.
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Check if user exists
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if the account is active
  if (!user.active) {
    // Assuming 'active' is a boolean field
    return next(
      new AppError(
        'Your account is inactive. Please contact support for further assistance.',
        403
      )
    );
  }

  // Check if the email is verified
  if (!user.emailVerified) {
    return next(
      new AppError(
        'Please verify your email before logging in. If you did not receive a verification email, please sign up again.',
        403
      )
    );
  }

  // Verify password
  if (!(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4. Generate and send JWT token to the client.
  createSendToken(user, 200, req, res);
});

// ----------------------------
// LOGOUT FUNCTION
// ----------------------------
exports.logout = (req, res) => {
  // 1. Set a cookie to invalidate the JWT.
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1 * 1000), // Cookie expires in 1 second.
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // 2. Send response indicating successful logout.
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
};

// ----------------------------
// PROTECT MIDDLEWARE
// ----------------------------
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from authorization header or cookies.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // 2. Check if token is provided.
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 3. Verify the token and decode the payload.
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // 4. Find the user associated with the token.
  const currentUser = await User.findOne({ where: { user_id: decoded.id, active: true } });

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 5. Check if the user has changed the password after the token was issued.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 6. Attach user details to the request object and proceed.
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ----------------------------
// RESTRICT ACCESS TO SPECIFIC ROLES FUNCTION
// ----------------------------
exports.restrictTo =
  (...roles) =>
    async (req, res, next) => {
      // 1. Check if the user's role is included in the allowed roles.
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
      // Check if the logged-in user is an admin
      if (req.user.role === 'admin') {
        const admin = await SchoolAdmin.findOne({
          include: [
            { model: Admin, as: 'Admin', where: { user_id: req.user.user_id } },
          ],
        });

        if (!admin) {
          return next(new AppError('No admin found with that user ID', 404));
        }

        // Set the school_admin_id param for admin routes
        req.school_admin_id = admin.school_admin_id;
      }

      // Check if the logged-in user is a teacher
      if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({
          include: [
            { model: User, as: 'User', where: { user_id: req.user.user_id } },
          ],
        });

        if (!teacher) {
          return next(new AppError('No teacher found with that user ID', 404));
        }

        // Set the teacher_id param for teacher routes
        req.teacher_id = teacher.teacher_id;
      }
      // 2. Proceed if user role is permitted.
      next();
    };

// ----------------------------
// CHECK IF USER IS LOGGED IN FUNCTION
// ----------------------------
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1. Check if JWT is present in cookies.
  if (req.cookies.jwt) {
    try {
      // 2. Verify the token and decode its payload.
      const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // 3. Find the user associated with the token.
      const currentUser = await User.findOne({ where: { user_id: decoded.id, active: true } });
      if (!currentUser || currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // 4. Attach user details to response locals and proceed.
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  // 5. Proceed if no token is present.
  next();
});

// ----------------------------
// FORGOT PASSWORD FUNCTION
// ----------------------------
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Find user by email.
  const user = await User.findOne({ where: { email: req.body.email } });

  // 2. Return error if user is not found.
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // Check if the account is active
  if (!user.active) {
    // Assuming 'active' is a boolean field
    return next(
      new AppError(
        'Your account is inactive. Please contact support for further assistance.',
        403
      )
    );
  }

  // 3. Generate a password reset token and save it.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 4. Construct the password reset URL.
  const resetURL =
    `${req.headers.origin}/auth/verify-reset-password/${resetToken}` ||
    `http://localhost:5173/auth/verify-reset-password/${resetToken}`;

  // 5. Attempt to send the password reset email.
  try {
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Forgot password succesfully',
    });
  } catch (err) {
    // 6. Handle email sending errors by resetting fields and sending an error response.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// ----------------------------
// RESET PASSWORD FUNCTION
// ----------------------------
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Hash the reset token from the request parameters.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2. Find the user with the matching reset token and valid expiration time.
  const user = await User.findOne({
    where: {
      active: true,
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
  });

  // 3. Return error if token is invalid or expired.
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 4. Update the user's password and clear the reset token fields.
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 5. Generate and send JWT token to the client.
  createSendToken(user, 200, req, res);
});

// ----------------------------
// CHANGE PASSWORD FUNCTION
// ----------------------------
exports.changePassword = catchAsync(async (req, res, next) => {
  // 1. Extract currentPassword and newPassword from the request body
  const { currentPassword, newPassword } = req.body;

  // 2. Validate input fields
  if (!currentPassword || !newPassword) {
    return next(
      new AppError('Please provide both current and new passwords.', 400)
    );
  }

  // 3. Find the current user with their password
  const user = await User.scope('withPassword').findOne({ where: { user_id : req.user.user_id, active: true } });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // 4. Verify that the current password provided is correct
  const isPasswordCorrect = await user.correctPassword(currentPassword);
  if (!isPasswordCorrect) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // 5. Change the password and save the user
  user.password = newPassword;
  await user.save();

  // 6. Generate and send JWT token to the client
  createSendToken(user, 200, req, res);
});
