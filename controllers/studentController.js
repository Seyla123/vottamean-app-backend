// Database models
const { Student, Info, Attendance, sequelize } = require('../models');

// Info Validators
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

// General Validators
const { isValidGuardianRelationship } = require('../validators/validators');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Add a new student and create default attendance
exports.addStudent = catchAsync(async (req, res, next) => {
  // 1. Extract fields from the request body
  const {
    class_id,
    guardian_name,
    guardian_email,
    guardian_relationship,
    guardian_phone_number,
    first_name,
    last_name,
    gender,
    phone_number,
    address,
    dob,
    school_admin_id,
  } = req.body;

  // 2. Validate input fields using custom validators
  try {
    isValidName(first_name);
    isValidName(last_name);
    isValidDOB(dob);
    isValidPhoneNumber(phone_number);
    isValidAddress(address);
    isValidGender(gender);
    isValidName(guardian_name);
    isValidEmail(guardian_email);
    isValidGuardianRelationship(guardian_relationship);
    isValidPhoneNumber(guardian_phone_number);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }

  // 3. Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // 4. Create info record
    const newInfo = await Info.create(
      {
        first_name,
        last_name,
        gender,
        phone_number,
        address,
        dob,
        school_admin_id,
      },
      { transaction }
    );

    // 5. Create student record with associated info
    const newStudent = await Student.create(
      {
        class_id,
        guardian_name,
        guardian_email,
        guardian_relationship,
        guardian_phone_number,
        info_id: newInfo.info_id,
        school_admin_id,
      },
      { transaction }
    );

    // 6. Commit the transaction
    await transaction.commit();

    // 7. Respond with success message
    res.status(201).json({
      status: 'success',
      data: {
        student: newStudent,
        info: newInfo,
      },
    });
  } catch (error) {
    // 8. Rollback the transaction in case of an error
    await transaction.rollback();
    return next(new AppError('Error creating student', 500));
  }
});

// Get Student By ID with additional info
exports.getStudent = factory.getOne(Student, 'student_id', [
  { model: Info, as: 'Info' },
]);

// Get all students with their attendance records
exports.getAllStudents = factory.getAll(Student, {}, [
  { model: Info, as: 'Info' },
]);

// Update student details and their attendance records
exports.updateStudent = factory.updateOne(Student, 'student_id');

// Update student status to inactive
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const studentId = req.params.id;

  // Check if student exists
  const student = await Student.findOne({ where: { student_id: studentId } });
  if (!student) {
    return next(new AppError('No student found with that ID', 404));
  }

  // Update the student's status to inactive
  await Student.update({ active: false }, { where: { student_id: studentId } });

  // handle attendance records
  await Attendance.update(
    { active: false },
    { where: { student_id: studentId } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Student status updated to inactive',
  });
});
