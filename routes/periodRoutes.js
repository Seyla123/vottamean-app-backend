const express = require('express');
const periodController = require('../controllers/periodController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(periodController.getAllPeriod)
  .post(periodController.createPeriod)
router
  .route('/:id')
  .get(periodController.getPeriod)
  .patch(periodController.updatePeriod)
  .delete(periodController.deletePeriod);

module.exports = router;