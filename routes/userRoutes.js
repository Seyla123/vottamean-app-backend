// Expressions library
const express = require('express');

// Authentication and User Controller
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const photoController = require('../controllers/photoController');

// Define Express Router
const router = express.Router();

// Restore user
router.post('/restore-user/:id', userController.restoreUser);

// Protect all route after this middleware
router.use(authController.protect);

// Require email verification for the following route
router.use(authController.requireEmailVerification);

// Restrict all routes to admin
router.use(authController.restrictTo('admin', 'teacher'));

// Get current user
router.get('/me', userController.getMe, userController.getUser);

// Update current user details
router.patch(
  '/update-me',
  userController.getMe,
  userController.updateMe,
  photoController.uploadUserPhoto,
  photoController.resizeUserPhoto
);

// Delete the current user
router.delete('/delete-me', userController.deleteMe);

// User management routes
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
