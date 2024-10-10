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
const { Op } = require('sequelize')

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
    include: { model: Info, as: 'Info',
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
exports.exportCsv = (data) =>(res) => {
  // Create CSV rows
  const csvRows = [];
  // add headers
  const headers = ['Student ID', 'Full Name', 'Start time', 'End time', 'Subject', 'Class', 'Address','Status','Date',];
  csvRows.push(headers.join(','));

  // format data and add to csv rows
  data.forEach(item => {
    const row = [
      item.Student.student_id,
      item.Student.Info.first_name + ' ' + item.Student.Info.last_name,
      item.Sessions.Period.start_time ,
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
        },
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
  ];
  req.query = filterObj(req.query, ...allowedFields);
  const filter = { active: 1 };
  const features = new APIFeatures(Attendance, req.query )
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .includeAssociations(associations);
  const attendance = await features.exec({
    where: filter,
    include: associations,
  });

  if (!attendance) {
    throw new AppError('No attendances found', 404);
  }
  return attendance
};
