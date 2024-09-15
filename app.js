// Module and Libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
// Routes
const routes = require('./routes');
// Error Handler
const globalErrorHandler = require('./controllers/errorController');

// App Middleware
const app = express();

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use(morgan('dev'));
}
// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(bodyParser.json());

// Home route (test endpoint)
app.get('/', (req, res) => {
  res.send('Welcome to the HexCode+ School API');
});

// Use all the routes from the routes folder
app.use('/api/v1', routes);

// Global error handler
app.use(globalErrorHandler);

// Export app
module.exports = app;
