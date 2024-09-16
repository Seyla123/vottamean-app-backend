// database
const { Period } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { filterObj } = require('../utils/filterObj');
const factory = require('./handlerFactory');

// comparation between start and end time
const compare_time = (start, end) => {
  start = new Date(start);
  end = new Date(end);

  if (start > end) {
    return res.status(400).json({
      message: 'Cannot be Load! End time must be greater than start time.',
    });
  }
  return start, end;
};

// Create Period
exports.createPeriod = catchAsync(async (req, res, next) => {
  const { start_time, end_time } = req.body;
  const school_admin_id  = req.school_admin_id;
  // filter the request body
  req.body = filterObj(req.body, 'start_time', 'end_time');
  req.body.school_admin_id = school_admin_id;
  factory.createOne(Period)(req, res, next);
})

// fetch all period
exports.getAllPeriod = factory.getAll(Period);

// get period
exports.getPeriod = factory.getOne(Period, 'period_id');

// update period
exports.updatePeriod = catchAsync(async (req, res) => {
  const { start_time, end_time } = req.body;

  // compare start time and end time
  compare_time(start_time, end_time);

  const periodId = req.params.id;

  // Validate the ID
  if (!periodId) {
    return res.status(400).json({ message: 'No ID Founded ' });
  }

  // Update the period by the correct primary key name
  const updatedCount = await Period.update(req.body, {
    where: { period_id: periodId },
  });

  if (updatedCount === 0) {
    return res.status(404).json({ message: 'Period not found' });
  }

  const updatePeriod = await Period.findOne({ where: { period_id: periodId } });
  return res.status(200).json({
    message: 'success',
    data: updatePeriod,
  });
});

// delete period
exports.deletePeriod = factory.deleteOne(Period, 'period_id');
 