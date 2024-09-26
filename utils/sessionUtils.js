const { Student, Session, Period, DayOfWeek, Subject, Class } = require('../models');
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
        subject: session.Subject.name,
        students: studentCount || 0,
        start_time: session.Period.start_time,
        end_time: session.Period.end_time,
      };
    }));
  
    return formattedSessions;
  };