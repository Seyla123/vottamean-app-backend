// Express library
const express = require('express');

// Authentication and Teacher Controller
const teacherController = require('../controllers/teacherController');
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');

// Define Express Router
const router = express.Router();

// Teacher verify email
router.get('/verify-email/:token', teacherController.verifyTeacherEmail);

// Protect all routes
router.use(authController.protect);

// Require email verification for the following route
router.use(authController.requireEmailVerification);

//Teacher teaching classes
router.get('/classes',authController.restrictTo('teacher'), sessionController.getAllTeacherSessions);
//router.get('/classes/:id',authController.restrictTo('teacher'), sessionController.getAllTeacherSessions);


// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Teacher signup route
router
  .route('/')
  .post(teacherController.signupTeacher)
  .get(teacherController.getAllTeachers);

router
  .route('/:id')
  .get(teacherController.getTeacher)
  .put(teacherController.updateTeacher)
  .delete(teacherController.deleteTeacher);

module.exports = router;
