// Frameworks and libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Errorr Handler
const globalErrorHandler = require('./controllers/errorController');

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

// Global Error Handling Middleware
app.use(globalErrorHandler);

// Export app
module.exports = app;
