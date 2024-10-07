// Frameworks and libraries
const sequelize = require('./config/database');
const app = require('./app');
const dotenv = require('dotenv');
const seedDatabase = require('./seeders/seed');
// Load environment variables based on NODE_ENV
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Define port
const PORT = process.env.PORT || 5001;

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
      // console to check stripe web hook
      console.log('stripe webhook secret :', process.env.STRIPE_WEBHOOK_SECRET);
      console.log(
        'stripe secret key access :',
        process.env.NODE_ENV === 'production'
          ? process.env.STRIPE_SECRET_KEY
          : process.env.STRIPE_TEST_SECRET_KEY
      );
    });
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
