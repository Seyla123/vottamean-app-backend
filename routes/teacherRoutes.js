// Express library
const express = require('express');

// Authentication and Teacher Controller
const teacherController = require('../controllers/teacherController');
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');
const studentController = require('../controllers/studentController');

// Define Express Router
const router = express.Router();

// Teacher verify email
router.get('/verify-email/:token', teacherController.verifyTeacherEmail);

// Teacher Complete Registration
router.post(
  '/complete-registration/:token',
  teacherController.completeRegistration
);

// Protect all routes
router.use(authController.protect);

// Require email verification for the following route
router.use(authController.requireEmailVerification);

//Teacher teaching schedule session
router.get(
  '/sessions',
  authController.restrictTo('teacher'),
  sessionController.getAllTeacherSessions
);

router.get(
  '/sessions/:id',
  authController.restrictTo('teacher'),
  studentController.getAllStudentsByClassInSession
);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Send invitation email
router.post('/send-invitation', teacherController.sendInvitationToTeacher);

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
