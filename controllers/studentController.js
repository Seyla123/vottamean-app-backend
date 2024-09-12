// Database models
const { Student, Info, Attendance, sequelize } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Add a new student and create default attendance
exports.addStudent = catchAsync(async (req, res, next) => {
  const {
    class_id,
    guardian_name,
    guardian_email,
    guardian_relationship,
    guardian_contact,
    first_name,
    last_name,
    phone_number,
    address,
    dob,
  } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Create info record
    const newInfo = await Info.create(
      {
        first_name,
        last_name,
        phone_number,
        address,
        dob,
      },
      { transaction }
    );

    // Create Student record with associated Info
    const newStudent = await Student.create(
      {
        class_id,
        guardian_name,
        guardian_email,
        guardian_relationship,
        guardian_contact,
        info_id: newInfo.info_id,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      status: 'success',
      data: {
        student: newStudent,
        info: newInfo,
      },
    });
  } catch (error) {
    // Rollback the transaction in case of error
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
