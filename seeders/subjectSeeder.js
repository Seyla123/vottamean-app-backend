const { Subject } = require('../models');

const insertSubjects = async () => {
  const subjects = [
    {
      subject_name: 'Mathematics',
      description: 'Study of numbers, shapes, and patterns.',
      active: true,
    },
    {
      subject_name: 'Science',
      description: 'Study of the physical and natural world.',
      active: true,
    },
    {
      subject_name: 'History',
      description: 'Study of past events and civilizations.',
      active: true,
    },
    {
      subject_name: 'English Literature',
      description: 'Study of written works in the English language.',
      active: true,
    },
    {
      subject_name: 'Physical Education',
      description: 'Study of physical fitness and sports.',
      active: true,
    },
  ];

  for (const subject of subjects) {
    const [subjectInstance, created] = await Subject.findOrCreate({
      where: { subject_name: subject.subject_name },
      defaults: {
        description: subject.description,
        active: subject.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (created) {
      console.log(`Inserted subject: ${subjectInstance.subject_name}`);
    } else {
      console.log(`Subject already exists: ${subjectInstance.subject_name}`);
    }
  }
};

module.exports = insertSubjects;