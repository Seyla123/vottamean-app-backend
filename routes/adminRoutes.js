// Express library
const express = require('express');

// Authentication and Admin Controller
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Admin routes
router
  .get('/', adminController.getAllAdmins)
  .post('/', adminController.addAdmin);

router
  .get('/:id', adminController.getAdmin)
  .put('/:id', adminController.updateAdmin)
  .delete('/:id', adminController.deleteAdmin);

module.exports = router;
