const { Sequelize } = require('sequelize');
const path = require('path');

// Determine the environment
const env = process.env.NODE_ENV || 'default';

// Load the appropriate .env file based on NODE_ENV
if (env === 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, `.env.production`),
  });
} else if (env === 'development') {
  require('dotenv').config({
    path: path.resolve(__dirname, `.env.development`),
  });
} else {
  require('dotenv').config({ path: path.resolve(__dirname, `.env`) });
}

// Base configuration
const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
};

// Environment-specific configurations (if any additional settings are needed)
const config = {
  development: { ...baseConfig },
  test: { ...baseConfig },
  production: { ...baseConfig },
};

// Select the configuration based on the current environment
const sequelize = new Sequelize(
  config[env].database,
  config[env].username,
  config[env].password,
  {
    host: config[env].host,
    dialect: config[env].dialect,
  }
);

module.exports = sequelize;
