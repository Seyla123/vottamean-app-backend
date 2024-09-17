// Database models
const { Session, Class, Period, Teacher, Subject, Info } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Utils
const { filterObj } = require('../utils/filterObj');
const { isBelongsToAdmin } = require('../utils/helper');

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
      { model: Class, as: 'Class' },
      { model: Period, as: 'Period' },
      { model: Teacher, as: 'Teacher', include: [{ model: Info, as: 'Info' }] },
      { model: Subject, as: 'Subject' },
    ],
    ['Class.class_name']
  )(req, res, next);
});

// get a single session
exports.getSession = catchAsync(async (req, res, next) => {
  factory.getOne(
    Session,
    'session_id',
    [
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
  await isBelongsToAdmin(req.params.id, 'session_id', req.school_admin_id, Session);
  //  filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj(req.body, 'class_id', 'subject_id', 'day_id', 'period_id', 'teacher_id');
  // update session
  factory.updateOne(Session, 'session_id')(req, res, next);
});

// delete session
exports.deleteSession = catchAsync(async (req, res, next) => {
  // check if session belongs to the school
  await isBelongsToAdmin(req.params.id, 'session_id', req.school_admin_id, Session);
  // delete session
  factory.deleteOne(Session, 'session_id')(req, res, next);
});