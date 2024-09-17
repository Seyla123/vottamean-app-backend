// Expressions library
const express = require('express');

// Authentication and session Controller
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');
// Define Express Router
const router = express.Router();

router.use(authController.protect);

router.get('/sessions',authController.restrictTo('teacher'), sessionController.getAllTeacherSessions);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));
// Route to create a new session
router
  .route('/')
  .post(sessionController.createSession)
  .get(sessionController.getAllSessions);

router
  .route('/:id')
  .get(sessionController.getSession)
  .patch(sessionController.updateSession)
  .delete(sessionController.deleteSession);
  
module.exports = router;
