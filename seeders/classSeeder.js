const { Class } = require('../models');

const insertClasses = async () => {
  const classes = [
    { class_name: 'Mathematics', description: 'Math class', active: true },
    { class_name: 'Science', description: 'Science class', active: true },
    // Add more classes as needed
  ];

  for (const cls of classes) {
    const [classInstance, created] = await Class.findOrCreate({
      where: { class_name: cls.class_name },
      defaults: {
        description: cls.description,
        active: cls.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (created) {
      console.log(`Inserted class: ${classInstance.class_name}`);
    } else {
      console.log(`Class already exists: ${classInstance.class_name}`);
    }
  }
};

module.exports = insertClasses;