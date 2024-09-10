// database
const { Period } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const Sequelize = require('sequelize');

// create period
exports.createPeriod = catchAsync (async (req, res) => {
    const { start_time, end_time } = req.body;

    const [startHour, startMinute] = start_time.split(':').map(Number);
    const [endHour, endMinute] = end_time.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      return res.status(400).json({
        message: 'End time must be greater than start time.',
      });
    }
    const period = await Period.create(req.body);
    res.status(201).json({
      message: 'Period created successfully',
      data: period,
    });

    if (!period) {
        return next(new AppError('Fail to create period', 500));
    }
});

// fetch all period
exports.getAllPeriod = catchAsync(async (req, res) => {
    const periods = await Period.findAll({
      attributes: [
        [
          Sequelize.fn(
            'CONCAT',
            Sequelize.col('start_time'),
            ' - ',
            Sequelize.col('end_time')
          ),
          'time',
        ], // Merge start_time and end_time
      ],
    })

    if (!periods) {
        return next(new AppError('Fail to load periods ', 500));
    }
    return res.status(200).json({
      data: periods,
    });

});

// get period
exports.getPeriod =  catchAsync(async (req, res) => {
    const period = await Period.findByPk(req.params.id, {
      attributes: [
        [
          Sequelize.fn(
            'CONCAT',
            Sequelize.col('start_time'),
            ' - ',
            Sequelize.col('end_time')
          ),
          'time_range',
        ], // Merge start_time and end_time
      ],
    });
    res.status(201).json({
      data: period,
    });
    if (!period) {
        return next(new AppError('Fail to find period', 500));
    }
});

// delete period
exports.deletePeriod = catchAsync(async (req, res) => {
    const periodId = req.params.id;
    // Validate the ID
    if (!periodId) {
      return res.status(400).json({ message: 'ID is required' });
    }
    // Delete the period by the correct primary key name
    const deletedCount = await Period.destroy({
      where: { period_id: periodId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Cannot delete period' });
    }

    res.status(204).json();
    if (!deletedCount) {
        return next(new AppError('Fail to find period', 500));
    }
});

// update period
exports.updatePeriod =  catchAsync(async (req, res) => {
    const { start_time, end_time } = req.body;

    const [startHour, startMinute] = start_time.split(':').map(Number);
    const [endHour, endMinute] = end_time.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      return res.status(400).json({
        message: 'End time must be greater than start time.',
      });
    }

    const periodId = req.params.id;
    // Validate the ID
    if (!periodId) {
      return res.status(400).json({ message: 'ID is required' });
    }
    // Update the period by the correct primary key name
    const updatedCount = await Period.update(req.body, {
      where: { period_id: periodId },
    });
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Period not found' });
    }
    res.status(204).json();
    if (!periodId) {
        return next(new AppError('Fail to find period', 500));
    }
});
