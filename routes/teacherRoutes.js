// Express library
const express = require('express');

// Authentication and Teacher Controller
const teacherController = require('../controllers/teacherController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Teacher verify email
router.get('/verifyEmail/teacher/:token', teacherController.verifyTeacherEmail);

// Protect all routes
router.use(authController.protect);

// Require email verification for the following route
router.use(authController.requireEmailVerification);

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
