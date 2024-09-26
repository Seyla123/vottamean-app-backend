// Expressions library
const express = require('express');

// Authentication and session Controller
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');
const sessionMiddleware = require('../middlewares/sessionMiddleware');
// Define Express Router
const router = express.Router();

router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Route to create a new session
router
  .route('/')
  .post(
    sessionMiddleware.checkExistingSession,
    sessionMiddleware.validateAdminOwnership, 
    sessionController.createSession).get(sessionController.getAllSessions);

router
  .route('/:id')
  .get(sessionController.getSession)
  .patch(sessionController.updateSession)
  .delete(sessionController.deleteSession);

module.exports = router;
