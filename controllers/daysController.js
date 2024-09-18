const { DayOfWeek } = require('../models/dayModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllDays = catchAsync(async (req, res, next) => {
  const response = await DayOfWeek.findAll();

  if (!response) {
    return next(new AppError('Fail to load days', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: response,
  });
});
