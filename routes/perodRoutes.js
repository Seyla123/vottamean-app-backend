const express = require('express');
const periodController = require('../controllers/periodController');

const router = express.Router();

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