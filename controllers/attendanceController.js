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

exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const school_admin_id = req.params.school_admin_id;
  const { subject_id, search, class_id } = req.query;

  const associations = [
    {
      model: Student,
      as: 'Student',
      where: { class_id },
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
          where: {
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
          where: { subject_id },
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
