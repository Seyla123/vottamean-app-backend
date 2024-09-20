// middlewares/attendanceMiddleware.js
const { Attendance, Student, Session } = require('../models');
const AppError = require('../utils/appError');
const { isBelongsToAdmin } = require('../utils/helper');

// Check if attendance already exists for the same student, session, and date
exports.isAttendanceExists = async (req, res, next) => {
  const { student_id, session_id } = req.body;
  const today = new Date().toISOString().split('T')[0]; // Format date to YYYY-MM-DD

  const existingAttendance = await Attendance.findOne({
    where: { student_id, session_id, date: today },
  });

  if (existingAttendance) {
    return next(new AppError('Attendance for this student, session, and date already exists', 400));
  }

  next();
};

// Verify if the session belongs to the teacher
exports.verifySessionBelongsToTeacher = async (req, res, next) => {
  const { session_id } = req.body;
  const teacher_id = req.teacher_id;

  try {
    await isBelongsToAdmin(session_id, 'session_id', teacher_id, Session, 'teacher_id');
    next();
  } catch (error) {
    return next(new AppError('You do not have permission to access this session', 403));
  }
};

// Verify if the session belongs to the student's class
exports.verifySessionBelongsToClass = async (req, res, next) => {
  const { student_id, session_id } = req.body;

  const student = await Student.findByPk(student_id, {
    attributes: ['class_id'],
  });

  if (!student) {
    return next(new AppError('Student not found', 404));
  }

  try {
    await isBelongsToAdmin(session_id, 'session_id', student.class_id, Session, 'class_id', 'Student');
    next();
  } catch (error) {
    return next(new AppError('This session does not belong to the student\'s class', 403));
  }
};
