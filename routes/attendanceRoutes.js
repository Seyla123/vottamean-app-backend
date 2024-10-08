const express = require('express');

// Controllers
const attendanceController = require('../controllers/attendanceController');
const authController = require('../controllers/authController');
const attendanceMiddleware = require('../middlewares/attendanceMiddleware');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect); // Applied globally

// Restrict routes to admin only
router
  .route('/')
  .get(authController.restrictTo('admin'), attendanceController.getAllAttendances);

  router
      .route('/export-attendance')
      .get(
        authController.restrictTo('admin'),
        attendanceController.exportAttendance
      )
router
  .route('/:id')
  .put(
    authController.restrictTo('admin'),
    attendanceMiddleware.checkAttendanceExists, 
    attendanceController.updateAttendance)
  .delete(
    authController.restrictTo('admin'),
    attendanceMiddleware.checkAttendanceExists, 
    attendanceController.deleteAttendance)
  .get(
    authController.restrictTo('admin'),
    attendanceMiddleware.checkAttendanceExists, 
    attendanceController.getAttendance);

// Restrict routes to teacher only
router.use(authController.restrictTo('teacher'));

// create attendance routes
router.post('/',
  attendanceMiddleware.verifySessionBelongsToTeacher,
  attendanceMiddleware.verifySessionBelongsToClass,
  attendanceController.createAttendance);


module.exports = router;
