// Frameworks and libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import routes

// Middleware
const app = express();

// Body parser
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the School API');
});

// Export app
module.exports = app;
