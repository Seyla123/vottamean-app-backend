const express = require('express');
const classController = require('../controllers/classController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict all routes to admin only
router.use(authController.restrictTo('admin'));

// Define routes
router
  .route('/')
  .post(classController.addClass) 
  .get(classController.getAllClasses); 

router
  .route('/:id')
  .get(classController.getClass) 
  .put(classController.updateClass) 
  .delete(classController.deleteClass); 

module.exports = router;
