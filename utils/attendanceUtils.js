const { Session,Period, DayOfWeek, Teacher, Info, School, SchoolAdmin, Subject, Class, Student } = require('../models');
const dayjs = require('dayjs');
const Email = require('./email');

// format data session for attendance information
exports.formatDataSessionfForAttendance = async (session_id) => {
    const todayDate = dayjs().format('YYYY-MM-DD');
    const session = await Session.findByPk(session_id, {
      include: [
        { model: DayOfWeek, as: 'DayOfWeek', attributes: ['day'] },
        { model: Period, as: 'Period', attributes: ['start_time', 'end_time'] },
        {model: Class, as: 'Class', attributes: ['class_name']},
        { model: Subject, as: 'Subject', attributes: ['name']},{
          model: Teacher, as: 'Teacher', include:[
            { model:Info,as: 'Info', attributes: ['first_name', 'last_name']}
          ]
        },
        { model: SchoolAdmin, as: 'SchoolAdmin',include:[
          { model:School, as: 'School'}
        ]},
      ]
    });
    const startTime = `${todayDate} ${session.Period.start_time}`;
    const endTime = `${todayDate} ${session.Period.end_time}`;
  
    const sessionData = {
      className: `${session.Class.class_name}`,
      subjectName: `${session.Subject.name}`,
      teacherName: `${session.Teacher.Info.first_name} ${session.Teacher.Info.last_name}`,
      sessionDate: `${session.DayOfWeek.day}, ${todayDate}`,
      studyTime: `${dayjs(startTime).format('h:mm A')} - ${dayjs(endTime).format('h:mm A')}`,
      schoolName: session.SchoolAdmin.School.school_name
    }
    return sessionData;
  };

exports.sendAttendanceEmail = async (data, status) => {
    const email = data.guardianEmail;
    const emailService = new Email({ email }, '#');
    await emailService.sendAttendanceNotification(data, status)
  };

exports.formattedStudentAttendance = async (student_id, sessionDa)=>{
    const student = await Student.findByPk(student_id, {
      include: { model: Info, as: 'Info' },
      atrributes: ['first_name', 'last_name']
    });
    
    const data = {
      studentName: `${student.Info.first_name} ${student.Info.last_name}`,
      guardianEmail: student.guardian_email,
      guardianName: student.guardian_name,
      ...sessionDa
    };

    return data;
   }