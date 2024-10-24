// Import libraries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const routes = require('./routes');
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
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://vottamean.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Stripe Webhook route (raw body parser)
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  routes
);

// JSON body parser for all other routes
app.use(bodyParser.json());

// Home route (test endpoint)
app.get('/', (req, res) => {
  res.send('Welcome to the HexCode+ School API');
});

// Use all the routes from the routes folder
app.use('/api/v1', routes);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
