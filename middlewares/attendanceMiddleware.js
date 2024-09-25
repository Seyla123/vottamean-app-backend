// middlewares/attendanceMiddleware.js
const { Attendance, Student, Session } = require('../models');
const AppError = require('../utils/appError');
const { isBelongsToAdmin } = require('../utils/helper');
const catchAsync = require('../utils/catchAsync');
// Check if attendance already exists for the same student, session, and date
exports.isAttendanceMarked = async (req, res, next) => {
  const { student_id, session_id } = req.body;
  const today = new Date().toISOString().split('T')[0]; // Format date to YYYY-MM-DD

  const existingAttendance = await Attendance.findOne({
    where: { student_id, session_id, date: today },
  });

  if (existingAttendance) {
    return next(new AppError('Attendance already marked for today', 400));
  }

  next();
};

// check attendance exists and belongs to the school admin ?
exports.checkAttendanceExists = async (req, res, next) => {
    const id = req.params.id;
    const school_admin_id = req.school_admin_id;
    const attendance = await Attendance.findOne({
      where: { attendance_id: id },
      include: {
        model: Student,
        as: 'Student',
        where: { school_admin_id },
      },
    });
  
    if (!attendance) {
      return next(new AppError('No attendance record found!', 404));
    }
  
    return next();
  };
// Verify if the session belongs to the teacher
exports.verifySessionBelongsToTeacher = catchAsync(async (req, res, next) => {
  const { session_id } = req.body;
  const teacher_id = req.teacher_id;
    await isBelongsToAdmin(session_id, 'session_id', teacher_id, Session, 'teacher_id');
    next();
});

// Verify if the session belongs to the student's class
exports.verifySessionBelongsToClass = catchAsync(async (req, res, next) => {
  const { session_id, attendance } = req.body;

  // extract student id from attendance array
  const studentIds = attendance.map(a => a.student_id);
  const sessions = await Session.findByPk(session_id);

  //find student with same class as session class
  const students = await Student.findAll({
    where:{
      student_id: studentIds,
      class_id: sessions.class_id
    },
    attributes: ['student_id', 'class_id']
  })
  // Create a map of found students' class_ids by student_id
  const studentClassMap = {};
  students.forEach(student => {
    studentClassMap[student.student_id] = student.class_id;
  });

  // Find missing students
  const missingStudents = studentIds.filter(student_id => !studentClassMap[student_id]);
  
  // If any students are missing or not enrolled in this class, return their IDs in the response
  if (missingStudents.length > 0) {
    return next(new AppError(`The following students IDs were not found or are not part of this class:  ${missingStudents.join(', ')}`, 404));
  }

  next();
});
