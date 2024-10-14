// Express library
const express = require('express');

// Authentication and Teacher Controller
const teacherController = require('../controllers/teacherController');
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');
const studentController = require('../controllers/studentController');
const photoController = require('../controllers/photoController');
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

router.get(
  '/assigned-students',
  authController.restrictTo('teacher'),
  studentController.getAllStudentsByTeacher
);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Send invitation email
router.post('/send-invitation', teacherController.sendInvitationToTeacher);

// Teacher signup route
router
  .route('/')
  .post(
    photoController.uploadUserPhoto,
    photoController.resizeUserPhoto,
    teacherController.signupTeacher
  )
  .get(teacherController.getAllTeachers)
  .delete(teacherController.deleteManyTeachers);

router
  .route('/:id')
  .get(teacherController.getTeacher)
  .put(
    photoController.uploadUserPhoto,
    photoController.resizeUserPhoto,
    teacherController.updateTeacher
  )
  .delete(teacherController.deleteTeacher);

module.exports = router;
