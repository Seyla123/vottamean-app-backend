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
  User,
} = require('../models');
// utils
const catchAsync = require('../utils/catchAsync');
const { filterObj } = require('../utils/filterObj');
const factory = require('./handlerFactory');
const { Op } = require('sequelize');
const { formatDataSessionfForAttendance, sendAttendanceEmail, formattedStudentAttendance } = require('../utils/attendanceUtils');
// Get all attendances
// associations for attendance
const getAssociations= (school_admin_id, class_id, subject_id, search)=>{
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
          attributes: ['subject_id', 'subject_name'],
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
  return associations
}
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
exports.getAllAttendances = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  const { subject_id, search, class_id } = req.query;

  const associations = getAssociations(school_admin_id, class_id, subject_id, search);

  req.query = filterObj(req.query, ...allowedFields);

  factory.getAll(Attendance, {}, associations, [])(req, res, next);
});
//Creates attendance for a student in a specific session.
exports.createAttendance = catchAsync(async (req, res, next) => {
  // Get today's date for attendance record
  const { session_id, attendance } = req.body;
  const today = new Date();

  // get session data formatted for sending attendance status email notification
  const sessionData = await formatDataSessionfForAttendance(session_id);
  
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

    // get formatted student attendance data for sending notification email to their gardian
   const data = await formattedStudentAttendance(student_id, sessionData)

    // send email notification to student's gardian
    await sendAttendanceEmail(data, status_id);

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

  // resovle all promises
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

exports.exportAttendance = catchAsync(async (req, res, next) => {
  
  // Example data (replace with your actual data)
  const data = [
    {
      id: 3,
      attendance_id: 12,
      name: "seyla son",
      time: "11:00 - 12:00",
      subject: "math",
      class: "class c",
      address: "123 Elm Street, Springfield, IL, 62701, Cambo",
      date: "2024-10-08",
      status_id: 2,
      status: "Late",
      img: null,
    },
    {
      id: 10,
      attendance_id: 9,
      name: "seyla sonn c",
      time: "11:00 - 12:00",
      subject: "math",
      class: "class c",
      address: "123 Elm Street, Springfield, IL, 62701, Cambo",
      date: "2024-10-08",
      status_id: 4,
      status: "Permission",
      img: null,
    },
  ];

  exportCsv(data);
});

const exportCsv = (data) => {
   // Create CSV rows
   const csvRows = [];
   const headers = ['Student ID', 'Attendance ID', 'Name', 'Time', 'Subject', 'Class', 'Address', 'Date', 'Status'];
   csvRows.push(headers.join(','));
 
   data.forEach(item => {
     const row = [
       item.id,
       item.attendance_id,
       item.name,
       item.time,
       item.subject,
       item.class,
       item.address,
       item.date,
       item.status
     ];
     csvRows.push(row.join(','));
   });
 
   const csvString = csvRows.join('\n');
 
   // Set response headers to trigger file download
   res.setHeader('Content-Type', 'text/csv');
   res.setHeader('Content-Disposition', 'attachment; filename=attendance_data.csv');
   res.status(200).send(csvString); // Send the CSV string as the response
}