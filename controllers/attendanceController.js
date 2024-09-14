const { Attendance, Student, Info, Class, SchoolAdmin, School, Admin, User, Status, Session, DayOfWeek, Period, Subject,Teacher } = require('../models');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { checkIfExists } = require('../utils/checkIfExists');
const { filterObj } = require('../utils/filterObj');

exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const school_admin_id = req.params.school_admin_id;
  const { subject_id, student_first_name, class_id } = req.query;

  if (!school_admin_id) {
    return next(new AppError('School Admin ID is required', 400));
  }

  const associations = [
    {
      model: Student,
      as: 'Student',
      where: class_id? {class_id:class_id} : {},
      include: [
        {
          model: Info,
          as: 'Info',
          attributes: ['first_name', 'last_name', 'gender', 'phone_number', 'address', 'dob', 'photo'],
          where : student_first_name ? {first_name: student_first_name} : {},
        },
        {
          model: Class,
          as: 'Class',
          attributes: ['class_name'],
        },
        {
          model: SchoolAdmin,
          as: 'SchoolAdmin',
          where: { school_admin_id: school_admin_id },
          include: [
            {
              model: School,
              as: 'School',
              attributes: ['school_name'],
            },
            {
              model: Admin,
              as: 'Admin',
              include: [
                {
                  model: User,
                  as: 'User',
                  attributes: ['user_id', 'email'],
                },
                {
                  model: Info,
                  as: 'Info',
                  attributes: ['first_name', 'last_name'],
                },
              ],
            },
          ],
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
      include: [
        {
          model: DayOfWeek,
          as: 'DayOfWeek',
          attributes: ['day_id', 'day'],
        },
        {
          model: Period,
          as: 'Period',
          attributes: ["period_id", 'start_time', 'end_time'],
        },
        {
          model: Subject,
          as: 'Subject',
          where: subject_id ? { subject_id: subject_id } : {},
          attributes: ['subject_id', 'name'],
        },
      ],
    },
  ];
  // Define allowed fields for filtering
  const allowedFields = ['date','student_id','session_id','status_id','page', 'sort', 'limit', 'fields'];
  const filteredQuery = filterObj(req.query, ...allowedFields);
  const features = new APIFeatures(Attendance, filteredQuery)
    .filter()  // Ensure correct filtering
    .sort()
    .limitFields()
    .paginate()
    .includeAssociations(associations);

  try {
    const allAttendances = await features.exec();
    console.log('result all attendance : ', allAttendances.length);

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


// Create new attendance
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
  const existingAttendance = await Attendance.findOne({
    where: { student_id, session_id, date: new Date() },
  });
  
  // check if the teacher is assigned to the session
  const teacher = await Session.findByPk(session_id, {
    include: {
      model: Teacher,
      as: 'Teacher',
      where: { teacher_id: teacher_id },
      attributes: ['teacher_id'],
  }
  });
  if (!teacher) {
    return next(
      new AppError('Only Assigned Teacher can create attendance in this session', 202)
    );
  }
  if (existingAttendance) {
    return next(new AppError('Attendance for this student, session, and date already exists', 400));
  }
  // Proceed to create new attendance
  const newAttendance = await Attendance.create({
    student_id,
    session_id,
    status_id,
    date: new Date(), // Use current date
  });

  // Send the response
  res.status(201).json({
    status: 'success',
    data: {
      attendance: newAttendance,
    },
  });
});