// middlewares/attendanceMiddleware.js
const { Attendance, Student, Session, DayOfWeek } = require('../models');
const AppError = require('../utils/appError');
const { isBelongsToAdmin } = require('../utils/helper');
const catchAsync = require('../utils/catchAsync');
const dayjs = require('dayjs');

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

exports.checkIfMarkedToday = catchAsync(async (req, res, next) => {
  const { session_id } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const findMarkSessionToday = await Attendance.count({
    where: {
      session_id: session_id,
      date: today
    }
  })
  if (findMarkSessionToday) {
    return next(new AppError('This class is already marked today.', 400));
  }
  next();
})

// Verify if the current day is correct in schedule or not
exports.verifyCurrentDay = catchAsync(async (req, res, next) => {
  const { session_id } = req.body;
  const session = await Session.findOne({
    where: { session_id, active: true },
    include: [{ model: DayOfWeek, as: 'DayOfWeek', attributes: ['day'] }]
  });
  if (session.DayOfWeek.day.toLocaleLowerCase() !== dayjs().format('dddd').toLocaleLowerCase()) {
    return next(new AppError('Attendance can only be marked for the scheduled day.', 400));
  }
  next();
})