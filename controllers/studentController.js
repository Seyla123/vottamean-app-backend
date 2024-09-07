// Database models
const { Student, Attendance, Class, Info } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Add a new student and create default attendance
exports.addStudent = catchAsync(async (req, res, next) => {
  const { name, class_id, user_id } = req.body;

  // Check if the class exists
  const classExists = await Class.findByPk(class_id);
  if (!classExists) {
    return next(new AppError('Class not found', 404));
  }

  // Create the student and assign it to the class
  const student = await Student.create({
    name,
    class_id,
    user_id,
  });

  // Create a default attendance record with 'absent' status
  await Attendance.create({
    date: new Date(),
    status: 'absent',
    student_id: student.student_id,
    class_id: class_id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      student,
    },
  });
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

// Delete student and their attendance records
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const studentId = req.params.id;

  // Delete the student's attendance records first
  await Attendance.destroy({ where: { student_id: studentId } });

  // Then delete the student
  const deletedStudent = await Student.destroy({
    where: { student_id: studentId },
  });

  if (!deletedStudent) {
    return next(new AppError('No student found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
