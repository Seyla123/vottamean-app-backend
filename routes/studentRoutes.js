// Express library
const express = require('express');

// uthentication and Student Controller
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin', 'teacher'));

// Student routes
router.route('/').get(studentController.getAllStudents);

router
  .route('/:id')
  .get(studentController.getStudent)
  .patch(studentController.updateStudent)
  .delete(studentController.deleteStudent);

module.exports = router;
