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
  User
} = require('../models');
// utils
const catchAsync = require('../utils/catchAsync');
const { filterObj } = require('../utils/filterObj');
const factory = require('./handlerFactory');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

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
  const { session_id, attendance } = req.body;
  const today = new Date();

  // Fetch existing attendance for the session and today
  const existingAttendance = await Attendance.findAll({
    where: {
      session_id,
      date: today
    }
  })

  // Create a map for quick lookup
  const existingRecordsMap = {};
  existingAttendance.forEach(record => {
    existingRecordsMap[record.student_id] = record;
  });

// Process attendance records
const promises = attendance.map(async ({ student_id, status_id }) => {
  if (existingRecordsMap[student_id]) {
    // Update existing record
    return Attendance.update({ status_id }, {
      where: {
        student_id,
        session_id,
        date: today
      }
    });
  } else {
    // Create a new attendance record
    return Attendance.create({ student_id, session_id, status_id, date: today });
  }
});

await Promise.all(promises);

return res.status(200).json({
  status: 'success',
  message: 'Attendance has been marked/updated successfully.'
});
});

exports.deleteAttendance = catchAsync(async (req, res, next) => {
  // Use factory to delete attendance
  factory.deleteOne(Attendance, 'attendance_id')(req, res, next);
});

exports.updateAttendance = catchAsync(async (req, res, next) => {
  // Filter out only allowed fields from req.body
  req.body = filterObj(req.body, 'status_id');

  // Use factory to update attendance
  factory.updateOne(Attendance, 'attendance_id')(req, res, next);
});

exports.getAttendance = catchAsync(async (req, res, next) => {
  // Use factory to get attendance
  const associations = [
    {
      model: Student,
      as: 'Student',
      where: { school_admin_id: req.school_admin_id },
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
          model: Class,
          as: 'Class'
        },
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
          include: [
            {
              model: Info,
              as: 'Info',
            },
            {
              model: User,
              as: 'User',
            }
          ]
        },
      ],
    },
  ];
  factory.getOne(Attendance, 'attendance_id', associations)(req, res, next);
});
