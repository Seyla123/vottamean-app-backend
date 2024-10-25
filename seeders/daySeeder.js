const { DayOfWeek } = require('../models');

const insertDays = async () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (const day of days) {
    const [dayInstance, created] = await DayOfWeek.findOrCreate({
      where: { day },
      defaults: {
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    
    if (created) {
      console.log(`Inserted day: ${dayInstance.day}`);
    } else {
      console.log(`Day already exists: ${dayInstance.day}`);
    }
  }
};

module.exports = insertDays;