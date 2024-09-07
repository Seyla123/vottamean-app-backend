// -------------------------
// Frameworks and libraries:
// -------------------------
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// ---------------
// IMPORT ROUTES :
// ---------------

// Auth and User Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

//

// Errorr Handler
const globalErrorHandler = require('./controllers/errorController');

// Middleware
const app = express();

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

// Body parser middleware for handling JSON payloads
app.use(bodyParser.json());

// Root Router middleware
app.get('/', (req, res) => {
  res.send('Welcome to the School API');
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

// Export app
module.exports = app;
