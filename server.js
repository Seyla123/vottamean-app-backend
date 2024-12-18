// Frameworks and libraries
const sequelize = require('./config/database');
const app = require('./app');
const dotenv = require('dotenv');
const seedDatabase = require('./seeders/seed');
// Load environment variables based on NODE_ENV
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Define port
const PORT = process.env.PORT || 8000;

// Connect to the database
sequelize
  .sync({
    force: false, //process.env.NODE_ENV === 'development', // True for development, false for production
  })
  .then(async () => {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Database connected successfully`);
      console.log(
        `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode...`
      );
    });
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
