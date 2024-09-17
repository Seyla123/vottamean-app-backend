const express = require('express');

const daysController = require('../controllers/daysController');

const router = express.Router();

router.route('/').get(daysController.getAllDays)

module.exports = router; 
