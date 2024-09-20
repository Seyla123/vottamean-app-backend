// models
const {
  Attendance,
  Student,
  Info,
  Class,
  SchoolAdmin,
  Status,
  Session,
  DayOfWeek,
  Period,
  Subject,
  Teacher,
} = require('../models');
// utils
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { filterObj } = require('../utils/filterObj');
const factory = require('./handlerFactory');
const { Op } = require('sequelize');
const { isBelongsToAdmin } = require('../utils/helper');

// Get all attendances
exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  const { subject_id, search, class_id } = req.query;

  // associations for attendance
  const associations = [
    {
      model: Student,
      as: 'Student',
      where: class_id && { class_id },
      include: [
        {
          model: Info,
          as: 'Info',
          attributes: [
            'info_id',
            'first_name',
            'last_name',
            'gender',
            'phone_number',
            'address',
            'dob',
            'photo',
          ],
          where: search && {
            [Op.or]: [
              { first_name: { [Op.like]: `%${search}%` } },
              { last_name: { [Op.like]: `%${search}%` } },
            ],
          },
        },
        {
          model: Class,
          as: 'Class',
          attributes: ['class_id', 'class_name'],
        },
      ],
    },
    {
      model: Status,
      as: 'Status',
      attributes: ['status'],
    },
    {
      model: Session,
      as: 'Sessions',
      required: true,
      include: [
        {
          model: DayOfWeek,
          as: 'DayOfWeek',
          attributes: ['day_id', 'day'],
        },
        {
          model: Period,
          as: 'Period',
          attributes: ['period_id', 'start_time', 'end_time'],
        },
        {
          model: Subject,
          as: 'Subject',
          where: subject_id && { subject_id },
          attributes: ['subject_id', 'name'],
          required: !!subject_id,
        },
        {
          model: SchoolAdmin,
          as: 'SchoolAdmin',
          where: { school_admin_id },
          required: !!school_admin_id,
        },
      ],
    },
  ];

  // filter allow fields
  const allowedFields = [
    'filter',
    'student_id',
    'session_id',
    'status_id',
    'page',
    'sort',
    'limit',
    'fields',
  ];
  req.query = filterObj(req.query, ...allowedFields);

  factory.getAll(Attendance, {}, associations, [])(req, res, next); 
});
//Creates attendance for a student in a specific session.
exports.createAttendance = catchAsync(async (req, res, next) => {
  // Get today's date for attendance record
  const today = new Date();

  // filter fields
  req.body = filterObj(req.body, 'student_id', 'session_id', 'status_id');
  req.body.date = today;

  // Use factory to create attendance
  factory.createOne(Attendance)(req, res, next);
});

// check attendance exists and belongs to the school admin ?
const checkAttendanceExists = async (id, school_admin_id) => {
  const attendance = await Attendance.findOne({
    where: { attendance_id: id },
    include: {
      model: Student,
      as: 'Student',
      where: { school_admin_id },
    },
  });

  if (!attendance) {
    throw new AppError(
      'No attendance record found or you do not have permission for this record',
      404
    );
  }

  return attendance;
};

exports.deleteAttendance = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const school_admin_id = req.school_admin_id;
  // Check if the attendance record exists
  await checkAttendanceExists(id, school_admin_id);

  // Use factory to delete attendance
  factory.deleteOne(Attendance, 'attendance_id')(req, res, next);
});

exports.updateAttendance = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const school_admin_id = req.school_admin_id;

  // Check if the attendance record exists
  await checkAttendanceExists(id, school_admin_id);

  // Filter out only allowed fields from req.body
  req.body = filterObj(req.body, 'status_id');

  // Use factory to update attendance
  factory.updateOne(Attendance, 'attendance_id')(req, res, next);
});

exports.getAttendance = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const school_admin_id = req.school_admin_id;
  // Check if the attendance record exists
  await checkAttendanceExists(id, school_admin_id);
  // Use factory to get attendance
  const associations = [
    {
      model: Student,
      as: 'Student',
      where: { school_admin_id },
      include: [
        {
          model: Info,
          as: 'Info',
        },
      ],
    },
    {
      model: Status,
      as: 'Status',
    },
    {
      model: Session,
      as: 'Sessions',
      required: true,
      include: [
        {
          model: DayOfWeek,
          as: 'DayOfWeek',
        },
        {
          model: Period,
          as: 'Period',
        },
        {
          model: Subject,
          as: 'Subject',
          required: true,
        },
        {
          model: Teacher,
          as: 'Teacher',
          required: true,
        },
      ],
    },
  ];
  factory.getOne(Attendance, 'attendance_id', associations)(req, res, next);
});
