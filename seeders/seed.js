const sequelize = require('./../config/database');
const insertDays = require('./daySeeder');
const insertStatuses = require('./statusSeeder');
const insertPeriods = require('./periodSeeder');
const insertSubjects = require('./subjectSeeder');
const insertClasses = require('./classSeeder');
const seedDatabase = async () => {
  try {
    await sequelize.sync({
      // force: process.env.NODE_ENV === 'development', // True for development, false for production
    });
    await insertDays();
    await insertStatuses();
    // await insertPeriods();
    // await insertSubjects();
    // await insertClasses();
    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding database: ', error);
  }
};

module.exports = seedDatabase;