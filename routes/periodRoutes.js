// Express library
const express = require('express');

// Controllers
const periodController = require('../controllers/periodController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Period routes
router
  .route('/')
  .get(periodController.getAllPeriod)
  .post(periodController.createPeriod);

router
  .route('/:id')
  .get(periodController.getPeriod)
  .patch(periodController.updatePeriod)
  .delete(periodController.deletePeriod);

module.exports = router;
