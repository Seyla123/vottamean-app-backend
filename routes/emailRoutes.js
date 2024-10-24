// Express library
const express = require('express');

// Controllers
const emailController = require('../controllers/emailController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Email route for general user
router.post('/receive-email-support', emailController.receiveEmailSupport);

// Email route for support team
router.post(
  '/send-email-support',
  authController.protect,
  authController.restrictTo('support'),
  emailController.sendEmailSupport
);

module.exports = router;
