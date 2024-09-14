// Express library
const express = require('express');

// Controllers
const attendanceController = require('../controllers/attendanceController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Info routes
router.get('/', attendanceController.getAllAttendances).post('/', attendanceController.createAttendance);


module.exports = router;
