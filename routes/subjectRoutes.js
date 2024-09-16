// Expressions library
const express = require('express');

// Authentication and User Controller
const authController = require('../controllers/authController');
const subjectController = require('../controllers/subjectController');

// Define Express Router
const router = express.Router();

router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Route to create a new subject
router
  .route('/')
  .post(subjectController.createSubject)
  .get(subjectController.getAllSubjects);

// Route to get a single subject by ID
router
  .route('/:id')
  .get(subjectController.getSubjectById)
  .put(subjectController.updateSubject)
  .delete(subjectController.deleteSubject);

module.exports = router;
