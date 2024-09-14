// Express library
const express = require('express');

// Controllers
const attendanceController = require('../controllers/attendanceController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
// Restrict routes to admin only
router.get('/',authController.restrictTo('admin'),userController.getMe, attendanceController.getAllAttendances);

// Restrict routes to teacher only
router.use(authController.restrictTo('teacher'));
router.post('/',userController.getMe, attendanceController.createAttendance);
// Info routes


module.exports = router;
