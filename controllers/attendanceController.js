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
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { checkIfExists } = require('../utils/checkIfExists');
const { filterObj } = require('../utils/filterObj');
const { Op } = require('sequelize');
const factory = require('./handlerFactory');
exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  const { subject_id, search, class_id } = req.query;

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
        {
          model: SchoolAdmin,
          as: 'SchoolAdmin',
          where: { school_admin_id },
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
      ],
    },
  ];

  const allowedFields = [
    'date',
    'student_id',
    'session_id',
    'status_id',
    'page',
    'sort',
    'limit',
    'fields',
  ];
  const filteredQuery = filterObj(req.query, ...allowedFields);
  const features = new APIFeatures(Attendance, filteredQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .includeAssociations(associations);

  try {
    const allAttendances = await features.exec();
    if (allAttendances.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: [],
        message: 'No attendance records found for the given criteria',
      });
    }

    res.status(200).json({
      status: 'success',
      results: allAttendances.length,
      data: allAttendances,
    });
  } catch (error) {
    return next(new AppError(`Invalid Query: ${error.message}`, 400));
  }
});

exports.createAttendance = catchAsync(async (req, res, next) => {
  const { student_id, session_id, status_id } = req.body;
  const teacher_id = req.params.teacher_id;

  // Validate student, session, and status IDs concurrently
  await Promise.all([
    checkIfExists(Student, student_id, 'Student'),
    checkIfExists(Session, session_id, 'Session'),
    checkIfExists(Status, status_id, 'Status'),
  ]);

  // Check if attendance already exists with the same date, student_id, and session_id
  const today = new Date();
  const existingAttendance = await Attendance.findOne({
    where: { student_id, session_id, date: today },
  });

  // Check if the teacher is assigned to the session
  const teacher = await Session.findByPk(session_id, {
    include: {
      model: Teacher,
      as: 'Teacher',
      where: { teacher_id },
      attributes: ['teacher_id'],
    },
  });

  // Check if the student is assigned to the class of the session
  const student = await Student.findByPk(student_id, {
    attributes: ['class_id'],
  });
  const studentSession = await Session.findByPk(session_id, {
    include: {
      model: Class,
      as: 'Class',
      where: { class_id: student.class_id },
      attributes: ['class_id'],
    },
  });

  if (!studentSession) {
    return next(
      new AppError(
        'Only Assigned Student can create attendance in this session',
        403
      )
    );
  }

  if (!teacher) {
    return next(
      new AppError(
        'Only Assigned Teacher can create attendance in this session',
        403
      )
    );
  }

  if (existingAttendance) {
    return next(
      new AppError(
        'Attendance for this student, session, and date already exists',
        400
      )
    );
  }

  // Proceed to create new attendance
  const newAttendance = await Attendance.create({
    student_id,
    session_id,
    status_id,
    date: today,
  });

  // Send the response
  res.status(201).json({
    status: 'success',
    data: {
      attendance: newAttendance,
    },
  });
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
