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
  getAttendanceReportDateRange,
  deleteAttendance
} = require('../utils/attendanceUtils');
const AppError = require('../utils/appError');

// get all attendance records 
exports.getAllAttendances = catchAsync(async (req, res, next) => {
  // Call the getAllAttendancesData utility function to get all attendance records
  const data = await getAllAttendancesData(req, res, next);

  // Send a successful response with the retrieved attendance records
  res.status(200).json({
    status: 'success',
    total_summary: data.attendanceSummary,
    all_subjects_unique: data.subjects,
    all_classes_unique: data.classes,
    results: data.attendanceCount,
    data: data.attendance,
  });
});

exports.createAttendance = catchAsync(async (req, res, next) => {
  const { session_id, attendance } = req.body;

  // Set today's date (ignoring time)
  const today = new Date().setHours(0, 0, 0, 0);

  // Fetch session data and existing attendance concurrently
  const [sessionData, existingAttendance] = await Promise.all([
    formatDataSessionfForAttendance(session_id),
    Attendance.findAll({
      where: { session_id, date: today },
    }),
  ]);

  // Create a map for existing attendance records
  const existingRecordsMap = {};
  existingAttendance.forEach(record => {
    existingRecordsMap[record.student_id] = record;
  });

  const newAttendance = [];
  const updateAttendance = [];

  // Process attendance records
  attendance.forEach(({ student_id, status_id }) => {
    if (existingRecordsMap[student_id]) {
      // Queue update operations
      updateAttendance.push({
        status_id,
        student_id,
        session_id,
        date: today,
      });
    } else {
      // Queue new attendance records for bulk insertion
      newAttendance.push({
        student_id,
        session_id,
        status_id,
        date: today,
      });
    }

    // Offload email sending asynchronously (without waiting)
    formattedStudentAttendance(student_id, sessionData).then((data) => {
      sendAttendanceEmail(data, status_id); // Don't await, let it run in the background
    });
  });

  // Perform batch database operations
  if (newAttendance.length) {
    await Attendance.bulkCreate(newAttendance);
  }

  if (updateAttendance.length) {
    // Perform bulk updates in parallel
    const updatePromises = updateAttendance.map((attendance) =>
      Attendance.update(
        { status_id: attendance.status_id },
        {
          where: {
            student_id: attendance.student_id,
            session_id: attendance.session_id,
            date: attendance.date,
          },
        }
      )
    );
    await Promise.all(updatePromises);
  }

  return res.status(200).json({
    status: 'success',
    message: 'Attendance has been marked successfully.',
  });
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
  exportCsv(data.attendance)(res);
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
    const formattedData = formatAttendanceReportData(attendanceRecords.attendance);
    // Get the unique dates from the attendance records, and their corresponding day of the week
    const datesWithDays = getAttendanceReportDateRange(formattedData);
    
    // Send the formatted result as JSON
    res.status(200).json({
      status: 'success',
      total_summary: attendanceRecords.attendanceSummary,
      all_subjects_unique: attendanceRecords.subjects,
      all_classes_unique: attendanceRecords.classes,
      results: attendanceRecords.attendanceCount,
      data: {
        school: schoolAdmin.School,
        classes: {
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
      total_summary: [],
      all_subjects_unique: data.subjects,
      all_classes_unique: data.classes,
      results: 0,
      message: 'No data found',
      data: {},
    });
  }
});

//Delete an attendance record by attendance ID
exports.deleteAttendance = catchAsync(async (req, res, next) => {
  const idArr = req.params.id;
  // delete attendance
  deleteAttendance(idArr)(req, res, next);
});
// Delete many attendances
exports.deleteManyAttendances = catchAsync(async (req, res, next) => {
  const idArr = req.body.ids;
  // delete array attendance
  deleteAttendance(idArr)(req, res, next);
});
