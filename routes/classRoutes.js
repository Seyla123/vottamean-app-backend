// Express library
const express = require('express');

// Authentication and Student Controller
const authController = require('../controllers/authController');
const classController = require('../controllers/classController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));


// Student routes
// router.route('/').get(classController.getA);
module.exports = router;