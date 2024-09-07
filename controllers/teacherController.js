// encryption Library
const bcrypt = require('bcryptjs');

// Database Models
const { Teacher, Info } = require('../models');

// Email Handlers
const { sendVerificationEmail } = require('../utils/authUtils');

// Error Handlers
const catchAsync = require('../utils/catchAsync');

// Factory ះandler
const factory = require('./handlerFactory');

// Get one teacher
exports.getTeacher = factory.getOne(Teacher, 'teacher_id', [
  { model: Info, as: 'Info' },
]);

// Get all teachers
exports.getAllTeachers = factory.getAll(Teacher, {}, [
  { model: Info, as: 'Info' },
]);

// Update teacher
exports.updateTeacher = factory.updateOne(Teacher, 'teacher_id');

// Delete teacher
exports.deleteTeacher = factory.deleteOne(Teacher, 'teacher_id');

// ----------------------------
// SIGNUP FUNCTION FOR TEACHERS
// ----------------------------
exports.signupTeacher = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    passwordConfirm,
    address,
    dob,
    role,
    first_name,
    last_name,
    phone_number,
  } = req.body;

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const formattedDob = new Date(dob);
  if (isNaN(formattedDob.getTime())) {
    return next(new AppError('Invalid date format for Date of Birth', 400));
  }

  const { token: verificationToken, hashedToken } = createVerificationToken();

  const tempToken = jwt.sign(
    {
      email,
      password,
      address,
      dob: formattedDob,
      role,
      first_name,
      last_name,
      phone_number,
      emailVerificationToken: hashedToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '10m' }
  );

  const verificationUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/verifyEmail/${verificationToken}?token=${tempToken}`;

  await sendVerificationEmail(email, verificationUrl);

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
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const tempToken = req.query.token;

  const decoded = await jwt.verify(tempToken, process.env.JWT_SECRET);

  if (decoded.emailVerificationToken !== hashedToken) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  const transaction = await sequelize.transaction();
  try {
    const {
      email,
      password,
      address,
      dob,
      role,
      first_name,
      last_name,
      phone_number,
    } = decoded;

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user with the role 'teacher' and hashed password
    const user = await User.create(
      { email, password: hashedPassword, emailVerified: true, role: 'teacher' },
      { transaction }
    );

    // Create the info record related to the user
    await Info.create(
      {
        user_id: user.user_id,
        first_name,
        last_name,
        phone_number,
        address,
        dob,
        role,
      },
      { transaction }
    );

    // Create the teacher record
    await Teacher.create({ user_id: user.user_id }, { transaction });

    // Commit the transaction if everything is successful
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Email verified and teacher account created successfully!',
    });
  } catch (err) {
    // Rollback in case of any error
    await transaction.rollback();
    return next(new AppError('Failed to create teacher account', 500));
  }
});
