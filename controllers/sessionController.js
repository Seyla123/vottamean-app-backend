// Database models
const { Session } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Utils
const { filterObj } = require('../utils/filterObj');
const { isBelongsToAdmin } = require('../utils/helper');
const { fetchTeacherSessions, formatTeacherSessions, includedSession, ExcludedSessionField } = require('../utils/sessionUtils');

// day js 
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);;

// create session
exports.createSession = catchAsync(async (req, res, next) => {
  // filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj( req.body, ...ExcludedSessionField );
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
  // check if session belongs to the school
  await isBelongsToAdmin(
    req.params.id,
    'session_id',
    req.school_admin_id,
    Session
  );
  //  filter the request body to only include 'class_id', 'subject_id','day_id','period_id','teacher_id'
  req.body = filterObj(req.body, ...ExcludedSessionField);

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
