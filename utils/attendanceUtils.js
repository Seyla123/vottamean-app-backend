const {
  Session,
  Period,
  DayOfWeek,
  Teacher,
  Info,
  School,
  SchoolAdmin,
  Subject,
  Class,
  Student,
  Attendance,
  Status
} = require('../models');
const dayjs = require('dayjs');
const Email = require('./email');
const { filterObj } = require('../utils/filterObj');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize')
const sequelize = require('sequelize')
/**
 * formatDataSessionfForAttendance
 * @description Format data session for attendance information
 * @param {Number} session_id - session id
 * @returns {Promise<Object>} - session data
 */
exports.formatDataSessionfForAttendance = async (session_id) => {
  const todayDate = dayjs().format('YYYY-MM-DD');
  const session = await Session.findByPk(session_id, {
    include: [
      { model: DayOfWeek, as: 'DayOfWeek', attributes: ['day'] },
      { model: Period, as: 'Period', attributes: ['start_time', 'end_time'] },
      { model: Class, as: 'Class', attributes: ['class_name'] },
      { model: Subject, as: 'Subject', attributes: ['subject_name'] },
      {
        model: Teacher,
        as: 'Teacher',
        include: [
          { model: Info, as: 'Info', attributes: ['first_name', 'last_name'] },
        ],
      },
      {
        model: SchoolAdmin,
        as: 'SchoolAdmin',
        include: [{ model: School, as: 'School' }],
      },
    ],
  });
  const startTime = `${todayDate} ${session.Period.start_time}`;
  const endTime = `${todayDate} ${session.Period.end_time}`;

  const sessionData = {
    className: `${session.Class.class_name}`,
    subjectName: `${session.Subject.subject_name}`,
    teacherName: `${session.Teacher.Info.first_name} ${session.Teacher.Info.last_name}`,
    sessionDate: `${session.DayOfWeek.day}, ${todayDate}`,
    studyTime: `${dayjs(startTime).format('h:mm A')} - ${dayjs(endTime).format(
      'h:mm A'
    )}`,
    schoolName: session.SchoolAdmin.School.school_name,
  };
  return sessionData;
};

/**
 * sendAttendanceEmail
 * @description Send attendance notification email to the guardian
 * @param {Object} data - student data
 * @param {Number} status - attendance status
 * @returns {Promise}
 */
exports.sendAttendanceEmail = async (data, status) => {
  const email = data.guardianEmail;
  const emailService = new Email({ email }, '#');
  await emailService.sendAttendanceNotification(data, status);
};

/**
 * formattedStudentAttendance
 * @description Format student attendance data for sending notification email
 * @param {Number} student_id - student id
 * @param {Object} sessionDa - session data
 * @returns {Promise}
 */
exports.formattedStudentAttendance = async (student_id, sessionDa) => {
  const student = await Student.findByPk(student_id, {
    include: {
      model: Info, as: 'Info',
      attributes: ['first_name', 'last_name'],
    },

  });

  const data = {
    studentName: `${student.Info.first_name} ${student.Info.last_name}`,
    guardianEmail: student.guardian_email,
    guardianName: `${student.guardian_first_name} ${student.guardian_last_name}`,
    ...sessionDa,
  };

  return data;
};

/**
 * exportCsv
 * @param {Object} data - data for exporting csv
 * @returns {Function}
 */
exports.exportCsv = (data) => (res) => {
  // Create CSV rows
  const csvRows = [];
  // add headers
  const headers = ['Student ID', 'Full Name', 'Start time', 'End time', 'Subject', 'Class', 'Address', 'Status', 'Date',];
  csvRows.push(headers.join(','));

  // format data and add to csv rows
  data.forEach(item => {
    const row = [
      item.Student.student_id,
      item.Student.Info.first_name + ' ' + item.Student.Info.last_name,
      item.Sessions.Period.start_time,
      item.Sessions.Period.end_time,
      item.Sessions.Subject.subject_name,
      item.Student.Class.class_name,
      `"${item.Student.Info.address}"`,
      item.Status.status,
      item.date
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');

  // Set response headers to trigger file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance_data.csv');
  res.status(200).send(csvString); // Send the CSV string as the response
}

/**
 * getAssociations
 * @description Get associations for attendance student
 * @param {Number} school_admin_id - school admin id
 * @param {Number} class_id - class id
 * @param {Number} subject_id - subject id
 * @param {String} search - student name search
 * @returns {Array} - associations
 */
const getAssociations = (school_admin_id, class_id, subject_id, search) => {
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
        },{
          model: Teacher,
          as: 'Teacher',
          include: [{ model: Info, as: 'Info' }],
          required:!!school_admin_id,
        }
      ],
    },
  ];
  return associations
}

/**
 * getAllAttendancesData
 * @description returns all attendances data
 * @param {Object} req - request
 * @returns {Promise} - promise
 */
exports.getAllAttendancesData = async (req) => {
  const school_admin_id = req.school_admin_id;
  const { subject_id, search, class_id } = req.query;

  const associations = getAssociations(school_admin_id, class_id, subject_id, search);
  const allowedFields = [
    'filter',
    'student_id',
    'session_id',
    'status_id',
    'page',
    'sort',
    'limit',
    'fields',
    'lte_date',
    'gte_date'
  ];
  req.query = filterObj(req.query, ...allowedFields);
  const filter = { active: 1 };
  const features = new APIFeatures(Attendance, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .includeAssociations(associations);
  const attendance = await features.exec({
    where: filter,
    include: associations,
  });

  const attendanceCount = await features.count(
    {
      where: filter,
      include: associations,
    }
  )
  if (!attendance) {
    throw new AppError('No attendances found', 404);
  }
  return {
    attendance,
    attendanceCount,
  }
};

/**
 * getStudentCount
 * @description returns total count of students in a class
 * @param {Number} schoolAdminId - school admin id
 * @param {Number} classId - class id
 * @returns {Promise<Object>} - promise with total count of students
 */
exports.getStudentCount = async (schoolAdminId, classId) => {
  const studentCounts = await Student.findAll({
    where: { school_admin_id: schoolAdminId, class_id: classId || null },
    include: [
      {
        model: Info,
        as: 'Info',
      },
    ],
  });
  const maleCount = studentCounts.filter((student) => student.Info.gender === 'Male').length;
  const femaleCount = studentCounts.filter((student) => student.Info.gender === 'Female').length;
  return {
    total_students: studentCounts.length,
    total_male : maleCount,
    total_female : femaleCount,
  };
};

/**
 * getSchoolInfo
 * @description returns school information by school admin id
 * @param {Number} schoolAdminId - school admin id
 * @returns {Promise<Object>} - promise with school information
 */
exports.getSchoolInfo = async (schoolAdminId) => {
  const schoolAdmin = await SchoolAdmin.findOne({
    where: { school_admin_id: schoolAdminId },
    attributes: [],
    include: [
      {
        model: School,
        as: 'School',
        attributes: ['school_name', 'school_phone_number', 'school_address'],
      },
    ],
  });
  return schoolAdmin;
};

/**
 * Format attendance report data
 * @param {Array<Object>} attendanceRecords - attendance records
 * @returns {Array<Object>} - formatted attendance report data
 */
exports.formatAttendanceReportData = (attendanceRecords) => {
  const formattedData = attendanceRecords.reduce((acc, record) => {
    const { Student, Sessions, Status } = record;
    const student_id = Student.student_id;
    const student_name = `${Student.Info.first_name} ${Student.Info.last_name}`;
    const gender = Student.Info.gender;
    const attendance_date = record.date;
    const subject_name = Sessions.Subject.subject_name;

    // Initialize student if not already present in the accumulator
    if (!acc[student_id]) {
      acc[student_id] = {
        id: student_id,
        fullName: student_name,
        gender,
        attendance: {}, // Initialize attendance object
      };
    }

    // Initialize date for the student if not already present in the attendance object
    if (!acc[student_id].attendance[attendance_date]) {
      acc[student_id].attendance[attendance_date] = {};
    }

    // Add the subject attendance status for the given date
    acc[student_id].attendance[attendance_date][subject_name] = Status.status;

    return acc;
  }, {});

  // Extract the student objects from the accumulator
  const result = Object.values(formattedData).map(student => ({
    id: student.id,
    fullName: student.fullName,
    gender: student.gender,
    attendance: student.attendance,
  }));

  return result;
};

/**
 * Extracts unique valid dates from the attendance report data, maps them to their
 * respective day of the week, and includes an array of unique subjects for each
 * date.
 *
 * @param {Object[]} result - Attendance report data
 *
 * @returns {Object[]} - Array of objects with date, day, and subject properties
 */
exports.getAttendanceReportDateRange = (result) => {
  const isValidDate = (dateString) => dayjs(dateString, 'YYYY-MM-DD', true).isValid();

  // Create a map to collect subjects for each valid date
  const attendanceMap = {};

  result.forEach(({ attendance }) => {
    Object.entries(attendance).forEach(([date, subjects]) => {
      if (!isValidDate(date)) return;

      // Initialize the date entry in the map if it doesn't exist
      if (!attendanceMap[date]) {
        attendanceMap[date] = {
          day: dayjs(date).format('dddd').toUpperCase(),
          subjects: new Set() // Use a Set to avoid duplicates
        };
      }

      // Add subjects to the Set (automatically avoids duplicates)
      Object.keys(subjects).forEach((subject) => attendanceMap[date].subjects.add(subject));
    });
  });

  // Convert the attendance map to an array with unique subjects
  const datesWithDays = Object.entries(attendanceMap)
    .map(([date, { day, subjects }]) => ({
      date,
      day,
      subject: Array.from(subjects), // Convert Set to Array
    }))
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date))); // Sort by date

  return datesWithDays;
};



/**
 * deleteAttendance
 * @description Delete one or many attendance records
 * @param {Number|Number[]} idArr - attendance id or array of attendance ids
 * @returns {Function} - express middleware function
 */
exports.deleteAttendance = (idArr) =>
  catchAsync(async (req, res, next) => {
    try {
      const attendance = await Attendance.update(
        { active: false },
        {
          where: {
            attendance_id: idArr,
            active: true,
            student_id: {
              [Op.in]: sequelize.literal(`(
            SELECT student_id FROM \`Students\` WHERE \`school_admin_id\` = ${req.school_admin_id}
          )`),
            },
          },
        }
      );
      
      if (attendance[0] === 0) {
        console.error(`No active attendance found with attendance_id: ${idArr}`);
        return next(new AppError(`No active attendance found with that attendance_id`, 404))
      }
      return res.status(200).json({
        status: 'success',
        message: `${attendance} attendance records successfully marked as inactive`,
      });
    } catch (error) {
      console.log('error :', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete attendance records',
      })
    }
  })