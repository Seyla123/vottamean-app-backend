const { Subject } = require('../models');

const insertSubjects = async () => {
  const subjects = [
    {
      name: 'Mathematics',
      description: 'Study of numbers, shapes, and patterns.',
      active: true,
    },
    {
      name: 'Science',
      description: 'Study of the physical and natural world.',
      active: true,
    },
    {
      name: 'History',
      description: 'Study of past events and civilizations.',
      active: true,
    },
    {
      name: 'English Literature',
      description: 'Study of written works in the English language.',
      active: true,
    },
    {
      name: 'Physical Education',
      description: 'Study of physical fitness and sports.',
      active: true,
    },
  ];

  for (const subject of subjects) {
    const [subjectInstance, created] = await Subject.findOrCreate({
      where: { name: subject.name },
      defaults: {
        description: subject.description,
        active: subject.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (created) {
      console.log(`Inserted subject: ${subjectInstance.name}`);
    } else {
      console.log(`Subject already exists: ${subjectInstance.name}`);
    }
  }
};

module.exports = insertSubjects;