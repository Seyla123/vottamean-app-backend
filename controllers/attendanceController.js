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
  getStudentCount,
  getSchoolInfo,
  formatAttendanceReportData,
  getAttendanceReportDateRange
} = require('../utils/attendanceUtils');
const AppError = require('../utils/appError');

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
  // Get class id and subject id from the query
  const { class_id, subject_id } = req.query;

  // Validate class id
  if (!class_id) {
    return next(new AppError('Class id is required', 400));
  }

  // Get sessions that belong to the school admin and the class
  const getSessionClass = await Session.findAll({
    where: {
      school_admin_id: req.school_admin_id,
      class_id: class_id || null,
    },
    attributes: [], // exclude Session columns
    include: [
      {
        model: Subject,
        as: 'Subject',
        attributes: ['subject_name'], // only include subject_name column
        where: subject_id ? { subject_id } : {}, // filter by subject id if provided
      },
      {
        model: Class,
        as: 'Class',
        attributes: ['class_name'], // only include class_name column
      },
    ],
  });

  // Check if any classes were found
  if (getSessionClass && getSessionClass.length > 0) {
    // Get the subject names and class names
    const subjectNames = getSessionClass.map(session => session.Subject.subject_name);
    const classNames = getSessionClass.map(session => session.Class.class_name);

    // Fetch student count, school information, and attendance records
    const [studentCount, schoolAdmin, attendanceRecords] = await Promise.all([
      getStudentCount(req.school_admin_id, class_id),
      getSchoolInfo(req.school_admin_id),
      getAllAttendancesData(req, res, next),
    ]);

    // use ultis to Format attendance data for the report
    const formattedData = formatAttendanceReportData(attendanceRecords);

    // Get the unique dates from the attendance records, and their corresponding day of the week
    const datesWithDays = getAttendanceReportDateRange(formattedData);

    // Send the formatted result as JSON
    res.status(200).json({
      status: 'success',
      results: formattedData.length,
      data: {
        school: schoolAdmin.School,
        class: {
          class_name: classNames[0],
          date_range: {
            start_date: datesWithDays[0]?.date,
            end_date: datesWithDays[datesWithDays.length - 1]?.date
          },
          student_count: studentCount
        },
        subjects: subjectNames,
        dates: datesWithDays,
        result: formattedData
      },
    });
  } else {
    // Send a success response with no classes found message
    res.status(200).json({
      status: 'success',
      results: 0,
      message: 'No data found',
      data: {},
    });
  }
});