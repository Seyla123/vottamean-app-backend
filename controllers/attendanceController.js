// models
const {
  Attendance,
  Student,
  Info,
  Class,
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
const {
  formatDataSessionfForAttendance,
  sendAttendanceEmail,
  formattedStudentAttendance,
  exportCsv,
  getAllAttendancesData,
} = require('../utils/attendanceUtils');

const dayjs = require('dayjs');

// get all attendance records 
exports.getAllAttendances = catchAsync(async (req, res, next) => {
  // Call the getAllAttendancesData utility function to get all attendance records
  const data = await getAllAttendancesData(req, res, next);

  // Send a successful response with the retrieved attendance records
  res.status(200).json({
    status: 'success',
    results: data.length,
    data: data,
  });
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
      date: today,
    },
  });

  // Create a map for quick lookup
  const existingRecordsMap = {};
  existingAttendance.forEach((record) => {
    existingRecordsMap[record.student_id] = record;
  });

  // Process attendance records
  const promises = attendance.map(async ({ student_id, status_id }) => {
    // get formatted student attendance data for sending notification email to their gardian
    const data = await formattedStudentAttendance(student_id, sessionData);

    // send email notification to student's gardian
    await sendAttendanceEmail(data, status_id);

    if (existingRecordsMap[student_id]) {
      // Update existing record
      return Attendance.update(
        { status_id },
        {
          where: {
            student_id,
            session_id,
            date: today,
          },
        }
      );
    } else {
      // Create a new attendance record
      return Attendance.create({
        student_id,
        session_id,
        status_id,
        date: today,
      });
    }
  });

  // resovle all promises
  await Promise.all(promises);

  return res.status(200).json({
    status: 'success',
    message: 'Attendance has been marked/updated successfully.',
  });
});

//Delete an attendance record by attendance ID
exports.deleteAttendance = catchAsync(async (req, res, next) => {
  // Use factory to delete attendance
  factory.deleteOne(Attendance, 'attendance_id')(req, res, next);
});

//Update an attendance record by attendance ID
exports.updateAttendance = catchAsync(async (req, res, next) => {
  // Filter out only allowed fields from req.body
  req.body = filterObj(req.body, 'status_id');

  // Use factory to update attendance
  factory.updateOne(Attendance, 'attendance_id')(req, res, next);
});

// Get a single attendance record by attendance ID
exports.getAttendance = catchAsync(async (req, res, next) => {
  // Get all associations
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
          as: 'Class',
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
            },
          ],
        },
      ],
    },
  ];
  // Use factory to get attendance
  factory.getOne(Attendance, 'attendance_id', associations)(req, res, next);
});

// export to csv file
exports.exportAttendance = catchAsync(async (req, res, next) => {
  // use getAllAttendance function from attendanceUlit to get all attendances
  const data = await getAllAttendancesData(req, res, next);
  // use exportCsv to export data to csv
  exportCsv(data)(res);
});

exports.getFormattedAttendanceData = catchAsync(async (req, res, next) => {
  const { class_id } = req.query;
  if(!class_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Class ID is required'
    });
  }
  const getSessionClass = await Session.findAll({
    where: { school_admin_id: req.school_admin_id, class_id: class_id || null },
    attributes: [],
    include: [
      {
        model: Subject,
        as: 'Subject',
        attributes: ['subject_name']
      },
      
    ]
  });
  
  const subjectNames = getSessionClass.map(session => session.Subject.subject_name);
  // Fetch all attendance records with related data
  const attendanceRecords = await getAllAttendancesData(req, res, next);


  // Step 2: Group and format the data using JavaScript
  const formattedData = attendanceRecords.reduce((acc, record) => {
    const { Student, Sessions, Status } = record;
    const student_id = Student.student_id;
    const student_name = `${Student.Info.first_name} ${Student.Info.last_name}`;
    const gender = Student.Info.gender;
    const attendance_date = record.date;
    const subject_name = Sessions.Subject.subject_name;

    // Initialize student if not already present
    if (!acc[student_id]) {
      acc[student_id] = {
        id: student_id,
        fullName: student_name,
        gender: gender,
        attendance: {}
      };
    }

    // Initialize date for the student if not already present
    if (!acc[student_id].attendance[attendance_date]) {
      acc[student_id].attendance[attendance_date] = {};
    }

    // Add the subject attendance status for the given date
    acc[student_id].attendance[attendance_date][subject_name] = Status.status;

    return acc;
  }, {});
  // Convert the object into an array format for easier frontend consumption
  const result = Object.values(formattedData).map(student => ({
    id: student.id,
    fullName: student.fullName,
    gender: student.gender,
    attendance: student.attendance
  }));
 // Helper function to check if a string is a valid date
const isValidDate = (dateString) => {
  return dayjs(dateString, 'YYYY-MM-DD', true).isValid();
};

// Extract unique valid dates and map them to their respective day of the week
const datesWithDays = Array.from(new Set(
  result.flatMap(item => Object.keys(item.attendance))
)).filter(isValidDate) // Only keep valid dates
.map(date => ({
  date,
  day: dayjs(date).format('dddd').toUpperCase()
}));

  // Send the formatted result as JSON
  res.status(200).json({
    status: 'success',
    results: result.length,
    data: {
      subjects: subjectNames,
      dates : datesWithDays,
      result
    },
  });
});