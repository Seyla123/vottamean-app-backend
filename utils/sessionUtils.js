const { Student, Session, Period, DayOfWeek, Subject, Class, Info, Teacher } = require('../models');
// Function to fetch teacher sessions
exports.fetchTeacherSessions = async (teacherId, filter, currentDay) => {
    return await Session.findAll({
      where: {
        teacher_id: teacherId,
        active: true,
        ...(filter === 'today' && { day_id: currentDay }),
      },
      include: [
        { model: DayOfWeek, as: 'DayOfWeek' },
        { model: Class, as: 'Class' },
        { model: Period, as: 'Period' },
        { model: Subject, as: 'Subject' },
      ],
    });
  };
  
  // Function to format session data
exports.formatTeacherSessions = async (sessions) => {
    const formattedSessions = await Promise.all(sessions.map(async (session) => {
      const studentCount = await Student.count({
        where: { class_id: session.Class.class_id, active: true },
      });
  
      return {
        session_id: session.session_id,
        class_name: session.Class.class_name,
        day: session.DayOfWeek.day,
        subject: session.Subject.subject_name,
        students: studentCount || 0,
        start_time: session.Period.start_time,
        end_time: session.Period.end_time,
      };
    }));
  
    return formattedSessions;
  };

//   Included model session
  exports.includedSession = [
    { model: DayOfWeek, as: 'DayOfWeek' },
    { model: Class, as: 'Class' },
    { model: Period, as: 'Period' },
    { model: Teacher, as: 'Teacher', include: [{ model: Info, as: 'Info' }] },
    { model: Subject, as: 'Subject' },
  ]

// Excluded session field
  exports.AllowedSessionField = [
    'class_id',
    'subject_id',
    'day_id',
    'period_id',
    'teacher_id']