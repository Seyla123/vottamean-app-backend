// Express library
const express = require('express');

// Authentication and User Controller
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// File upload and resizing Controller
const photoController = require('../controllers/photoController');

// Define Express Router
const router = express.Router();

// Signup and Login routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Email verification route
router.get('/verify-email/:token', authController.verifyEmail);

// Should be enable after email get verified
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protect all route after this middleware
router.use(authController.protect);

// Require email verification for the following route
router.use(authController.requireEmailVerification);

// Get current user
router.get('/me', userController.getMe, userController.getUser);

// Logout current user
router.post('/logout', authController.logout);

// Admin route
router.use(authController.restrictTo('admin'));

// Password management route for admin
router.patch('/change-password', authController.changePassword);

// User management routes
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser, userController.getMe)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
