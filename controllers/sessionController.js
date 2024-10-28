// Database models
const { Session, Class, Subject, Period, Teacher } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Utils
const { filterObj } = require('../utils/filterObj');
const { isBelongsToAdmin } = require('../utils/helper');
const { fetchTeacherSessions, formatTeacherSessions, includedSession, AllowedSessionField } = require('../utils/sessionUtils');

// day js 
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);;

// create session
exports.createSession = catchAsync(async (req, res, next) => {
  // filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj( req.body, ...AllowedSessionField );
  req.body.school_admin_id = req.school_admin_id;
  console.log(req.body);
  
  // create new Session
  factory.createOne(Session)(req, res, next);
});

// get all sessions
exports.getAllSessions = catchAsync(async (req, res, next) => {
  factory.getAll(
    Session, { school_admin_id: req.school_admin_id },
    includedSession,
    ['']
  )(req, res, next);
});

// get a single session
exports.getSession = catchAsync(async (req, res, next) => {
  factory.getOne(
    Session,
    'session_id',
    includedSession,
    { active: true, school_admin_id: req.school_admin_id }
  )(req, res, next);
});

// update session
exports.updateSession = catchAsync(async (req, res, next) => {

  const { class_id, subject_id, period_id, teacher_id } = req.body;
  // check if session belongs to the school
  const existingSession = await Session.findOne({
    where: {
      session_id: req.params.id,
      school_admin_id: req.school_admin_id,
      active: true,
    },
    raw:true
  })
  if(!existingSession){
    return next(new AppError('Session not found', 400));
  }
  await isBelongsToAdmin(
    req.params.id,
    'session_id',
    req.school_admin_id,
    Session
  );

  // Check if the class ID has changed and validate admin ownership
  if (Number(class_id) !== existingSession.class_id) {
    await isBelongsToAdmin(class_id, 'class_id', req.school_admin_id, Class);
  }

  // Check if the subject ID has changed and validate admin ownership
  if (Number(subject_id) !== existingSession.subject_id) {
    await isBelongsToAdmin(subject_id, 'subject_id', req.school_admin_id, Subject);
  }

  // Check if the period ID has changed and validate admin ownership
  if (Number(period_id) !== existingSession.period_id) {
    await isBelongsToAdmin(period_id, 'period_id', req.school_admin_id, Period);
  }

  // Check if the teacher ID has changed and validate admin ownership
  if (Number(teacher_id) !== existingSession.teacher_id) {
    await isBelongsToAdmin(teacher_id, 'teacher_id', req.school_admin_id, Teacher);
  }

  //  filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj(req.body, ...AllowedSessionField);

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

  // Fetch all teacher sessions
  const sessions = await fetchTeacherSessions(req.teacher_id, filter, currentDay);
  
  // Format the sessions
  const formattedSessions = await formatTeacherSessions(sessions);

  // Send the transformed data as the response
  res.status(200).json({
    status: 'success',
    data: formattedSessions,
  });
});

// Delete many sessions
exports.deleteManySessions = catchAsync(async (req, res, next) => {
  factory.deleteMany(Session, 'session_id')(req, res, next);
});