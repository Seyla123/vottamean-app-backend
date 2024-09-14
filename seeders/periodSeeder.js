const { Period } = require('../models');

const insertPeriods = async () => {
  const periods = [
    {
      start_time: '08:00:00',
      end_time: '08:50:00',
      active: true,
    },
    {
      start_time: '09:00:00',
      end_time: '09:50:00',
      active: true,
    },
    {
      start_time: '10:00:00',
      end_time: '10:50:00',
      active: true,
    },
    {
      start_time: '11:00:00',
      end_time: '11:50:00',
      active: true,
    },
    {
      start_time: '12:00:00',
      end_time: '12:50:00',
      active: true,
    },
  ];

  for (const period of periods) {
    const [periodInstance, created] = await Period.findOrCreate({
      where: { start_time: period.start_time, end_time: period.end_time },
      defaults: {
        active: period.active,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (created) {
      console.log(`Inserted period: Start - ${periodInstance.start_time}, End - ${periodInstance.end_time}`);
    } else {
      console.log(`Period already exists: Start - ${periodInstance.start_time}, End - ${periodInstance.end_time}`);
    }
  }
};

module.exports = insertPeriods;