const express = require('express');

const statusController = require('../controllers/statusController');

const router = express.Router();

router.route('/').get(statusController.getAllStatus)

module.exports = router; 
