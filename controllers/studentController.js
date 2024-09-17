// Database models
const { Student, Info, sequelize, Class } = require('../models');
// Info Validators
const {
  isValidEmail,
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

// check is belongs to admin function
const { isBelongsToAdmin } = require('../utils/helper');
const { isBelongsToAdmin } = require('../utils/isBelongsToAdmin');
const infoValidator = require('../validators/infoValidator');

// Add a new student and create default attendance
exports.addStudent = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
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
        dob
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
exports.getStudent = catchAsync(async(req,res,next)=>{
  factory.getOne(Student, 'student_id', [
    { model: Info, as: 'Info' },
    { model: Class, as: 'Class' },
  ], {active: true, school_admin_id:req.school_admin_id})(req, res,next);
});

// Get all students with their attendance records
exports.getAllStudents = catchAsync(async (req, res, next) => {
  factory.getAll(Student, { school_admin_id: req.school_admin_id }, [
    { model: Info, as: 'Info' },
    { model: Class, as: 'Class' },
  ],['Info.first_name', 'Info.last_name'])(req, res, next);
});

//Update all students with their associated
exports.updateStudent = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, 'student_id', req.school_admin_id, Student);
  const [studentUpdateCount] = await Student.update(req.body, {
    where: { student_id: req.params.id }
  });
  if (studentUpdateCount === 0) {
    return next(new AppError('No student found with that ID', 404));
  }
  if (req.body.Info) {
    const { info_id } = req.body.Info;
    if (!info_id) {
      return next(new AppError('Info ID must be provided for updating Info record', 400));
    }
    const [infoUpdateCount] = await Info.update(req.body.Info, {where: { info_id }});

    if (infoUpdateCount === 0) {
      return next(new AppError('No info record found with that ID', 404));
    }
  }
  res.status(200).json({
    status: 'success',
    message: 'Student with their associated have been updated successfully',
  });
});
  
// Update student status to inactive
exports.deleteStudent = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id,'student_id' ,req.school_admin_id, Student);
  factory.deleteOne(Student,'student_id')(req, res, next);0
});
