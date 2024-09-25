// Database models
const { Session, Class, Period, Teacher, Subject, Info , DayOfWeek ,Student} = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Utils
const { filterObj } = require('../utils/filterObj');
const { isBelongsToAdmin } = require('../utils/helper');

// day js 
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);;

// create session
exports.createSession = catchAsync(async (req, res, next) => {
  // check if session already exists in the school
  const existingSession = await Session.findOne({
    where: {
      class_id: req.body.class_id,
      teacher_id: req.body.teacher_id,
      day_id: req.body.day_id,
      period_id: req.body.period_id,
      subject_id: req.body.subject_id,
      school_admin_id: req.school_admin_id,
      active: true,
    },
  });
  if (existingSession) {
    return next(new AppError('Session already exists', 400));
  }
  await Promise.all([
    isBelongsToAdmin(req.body.class_id, 'class_id', req.school_admin_id, Class),
    isBelongsToAdmin(
      req.body.period_id,
      'period_id',
      req.school_admin_id,
      Period
    ),
    isBelongsToAdmin(
      req.body.teacher_id,
      'teacher_id',
      req.school_admin_id,
      Teacher
    ),
    isBelongsToAdmin(
      req.body.subject_id,
      'subject_id',
      req.school_admin_id,
      Subject
    ),
  ]);
  // filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj(
    req.body,
    'class_id',
    'subject_id',
    'day_id',
    'period_id',
    'teacher_id'
  );
  req.body.school_admin_id = req.school_admin_id;
  // create new Session
  factory.createOne(Session)(req, res, next);
});

// get all sessions
exports.getAllSessions = catchAsync(async (req, res, next) => {
  factory.getAll(
    Session,
    {
      school_admin_id: req.school_admin_id,
    },
    [
      { model: DayOfWeek, as: 'DayOfWeek' },
      { model: Class, as: 'Class' },
      { model: Period, as: 'Period' },
      { model: Teacher, as: 'Teacher', include: [{ model: Info, as: 'Info' }] },
      { model: Subject, as: 'Subject' },
    ],
    ['']
  )(req, res, next);
});

// get a single session
exports.getSession = catchAsync(async (req, res, next) => {
  factory.getOne(
    Session,
    'session_id',
    [
      { model: DayOfWeek, as: 'DayOfWeek' },
      { model: Class, as: 'Class' },
      { model: Period, as: 'Period' },
      { model: Teacher, as: 'Teacher', include: [{ model: Info, as: 'Info' }] },
      { model: Subject, as: 'Subject' },
    ],
    { active: true, school_admin_id: req.school_admin_id }
  )(req, res, next);
});

// update session
exports.updateSession = catchAsync(async (req, res, next) => {
  // check if session belongs to the school
  await isBelongsToAdmin(
    req.params.id,
    'session_id',
    req.school_admin_id,
    Session
  );
  //  filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj(
    req.body,
    'class_id',
    'subject_id',
    'day_id',
    'period_id',
    'teacher_id'
  );
  // update session
  factory.updateOne(Session, 'session_id')(req, res, next);
});

// delete session
exports.deleteSession = catchAsync(async (req, res, next) => {
  // check if session belongs to the school
  await isBelongsToAdmin(
    req.params.id,
    'session_id',
    req.school_admin_id,
    Session
  );
  // delete session
  factory.deleteOne(Session, 'session_id')(req, res, next);
});

// teacher site
// get all teacher session

exports.getAllTeacherSessions = catchAsync(async (req, res, next) => {
  const filter = req.query.filter;
  const currentDay = dayjs().isoWeekday();

  // Fetch all teacher sessions with the necessary associations
  const sessions = await Session.findAll({
    where: {
      teacher_id: req.teacher_id,
      active: true,
      ...(filter === 'today' && { day_id: currentDay }),
    },
    include: [
      { model: DayOfWeek, as: 'DayOfWeek' },
      { model: Class, as: 'Class' },
      { model: Period, as: 'Period' },
      { model: Subject, as: 'Subject' },
    ],
  });

  // Transform the data into the required format
  const formattedSessions = await Promise.all(sessions.map(async (session) => {
    // Count the number of students in the class
    const studentCount = await Student.count({
      where: { class_id: session.Class.class_id, active: true }, // Assuming classId is the foreign key in Student
    });

    return {
      session_id: session.session_id,
      Class:{
        class_id: session.Class.class_id,
        class_name: session.Class.class_name,
      },
      day: session.DayOfWeek.day, // assuming 'day' is the field in DayOfWeek model
      subject: session.Subject.name, // assuming 'name' is the field in Subject model
      students: studentCount || 0, // Count the number of students
      start_time:session.Period.start_time,
      end_time:session.Period.end_time,
    };
  }));
  
if(!sessions){
  return next(new AppError('No teacher session found', 404));  
}
  // Send the transformed data as the response
  res.status(200).json({
    status: 'success',
    data: formattedSessions,
  });
});
