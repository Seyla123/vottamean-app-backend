// Express library
const express = require('express');

// Controllers
const infoController = require('../controllers/infoController');
const authController = require('../controllers/authController');

// Define Express Router
const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Info routes
router.route('/').get(infoController.getAllInfos);

router
  .route('/:id')
  .get(infoController.getInfo)
  .put(infoController.updateInfo)
  .delete(infoController.deleteInfo);

module.exports = router;
