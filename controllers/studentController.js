// Database models
const { Student, Info, sequelize, Class, Session } = require('../models');
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
const { filterObj } = require('../utils/filterObj');

// check is belongs to admin function
const { isBelongsToAdmin } = require('../utils/helper');
const { checkStudentLimit } = require('../utils/paymentHelper');

// Add a new student and create default attendance
exports.addStudent = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;

  // 1. Check the subscription plan and limit
  try {
    await checkStudentLimit(school_admin_id);
  } catch (error) {
    return next(error);
  }

  // 2. Extract fields from the request body
  const {
    class_id,
    guardian_first_name,
    guardian_last_name,
    guardian_email,
    guardian_relationship,
    guardian_phone_number,
    first_name,
    last_name,
    gender,
    phone_number,
    address,
    dob,
    photo,
  } = req.body;

  // 2. Validate input fields using custom validators
  try {
    if (!class_id) {
      throw new Error('class_id is required');
    }
    isValidName(first_name);
    isValidName(last_name);
    isValidDOB(dob);
    isValidPhoneNumber(phone_number);
    isValidAddress(address);
    isValidGender(gender);
    isValidName(guardian_first_name);
    isValidName(guardian_last_name);
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
        photo,
      },
      { transaction }
    );

    // 5. Create student record with associated info
    const newStudent = await Student.create(
      {
        class_id,
        guardian_first_name,
        guardian_last_name,
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
exports.getStudent = catchAsync(async (req, res, next) => {
  factory.getOne(
    Student,
    'student_id',
    [
      { model: Info, as: 'Info' },
      { model: Class, as: 'Class' },
    ],
    { active: true, school_admin_id: req.school_admin_id }
  )(req, res, next);
});

// Get all students with their attendance records
exports.getAllStudents = catchAsync(async (req, res, next) => {
  factory.getAll(
    Student,
    { school_admin_id: req.school_admin_id },
    [
      { model: Info, as: 'Info' },
      { model: Class, as: 'Class' },
    ],
    ['Info.first_name', 'Info.last_name']
  )(req, res, next);
});

// Update all students with their associated info
exports.updateStudent = catchAsync(async (req, res, next) => {
  // filter allow fields
  const allowedFields = [
    'class_id',
    'guardian_first_name',
    'guardian_last_name',
    'guardian_email',
    'guardian_relationship',
    'guardian_phone_number',
    'first_name',
    'last_name',
    'gender',
    'phone_number',
    'address',
    'dob',
    'photo',
  ];
  req.body = filterObj(req.body, ...allowedFields);

  const school_admin_id = req.school_admin_id;
  const transaction = await sequelize.transaction();

  try {
    //update student
    await Student.update(req.body, {
      where: { student_id: req.params.id, school_admin_id },
      transaction,
    });
    //find student after update
    const student = await Student.findOne({
      where: { student_id: req.params.id, school_admin_id },
      include: [{ model: Info, as: 'Info' }],
      transaction,
    });

    //after find student update info
    const info_id = student.Info.info_id;
    await Info.update(req.body, {
      where: { info_id },
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    // respond with success message
    const updatedStudent = await Student.findOne({
      where: { student_id: req.params.id, school_admin_id },
      include: { model: Info, as: 'Info' },
    });

    res.status(201).json({
      status: 'success',
      message: 'Update student anf their info successfully',
      data: updatedStudent,
    });
  } catch (error) {
    await transaction.rollback();
    return next(new AppError('Error updating student or info', 500));
  }
});

// Update student status to inactive
exports.deleteStudent = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(
    req.params.id,
    'student_id',
    req.school_admin_id,
    Student
  );
  factory.deleteOne(Student, 'student_id')(req, res, next);
});

// Get all students by class
exports.getAllStudentsByClassInSession = catchAsync(async (req, res, next) => {
  const session_id = req.params.id;
  const teacher_id = req.teacher_id;

  // Check if session belongs to the teacher
  const session = await Session.findOne({
    where: { session_id, teacher_id },
  });

  if (!session) {
    return next(new AppError('Session not found', 400));
  }

  // Find all students in the same class
  const students = await Student.findAll({
    where: { class_id: session.class_id },
    include: [{ model: Info, as: 'Info' }],
  });

  // Respond successfully with students
  res.status(200).json({
    status: 'success',
    length: students.length,
    data: students,
  });
});

// Mark multiple students as inactive
exports.deleteSelectedStudents = catchAsync(async (req, res, next) => {
  // Validate the ids array in the request body
  const idArr = req.body.ids;
  console.log('this ids arr :', idArr);
  factory.deleteMany(Student, 'student_id')(req, res, next);

});
