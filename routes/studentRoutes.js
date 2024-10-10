// Express library
const express = require('express');

// Authentication and Student Controller
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const photoController = require('../controllers/photoController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Student routes
router
  .route('/')
  .get(
    photoController.uploadUserPhoto,
    photoController.resizeUserPhoto,
    studentController.getAllStudents
  )
  .post(studentController.addStudent);

// Routes for individual student operations
router
  .route('/:id')
  .get(studentController.getStudent)
  .patch(studentController.updateStudent)
  .delete(studentController.deleteStudent);

// Route for deleting multiple students
router.route('/delete-many').delete(studentController.deleteSelectedStudents);

module.exports = router;
