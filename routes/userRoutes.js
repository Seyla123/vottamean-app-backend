// Expressions library
const express = require('express');

// Authentication and User Controller
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// Define Express Router
const router = express.Router();

// Protect all route after this middleware
router.use(authController.protect);

// Restrict all routes to admin
router.use(authController.restrictTo('admin'));

// User management routes
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
