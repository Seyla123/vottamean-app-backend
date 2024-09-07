// Express library
const express = require('express');

// Authentication and Teacher Controller
const teacherController = require('../controllers/teacherController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

router.get('/', teacherController.getAllTeachers);

router
  .get('/:id', teacherController.getTeacher)
  .put('/:id', teacherController.updateTeacher)
  .delete('/:id', teacherController.deleteTeacher);

module.exports = router;
