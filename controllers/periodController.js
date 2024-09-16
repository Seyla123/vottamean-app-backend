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

const checkIfBelongs = async (id,school_admin_id) => {
  // Validate the ID
  const period = await Period.findOne({
    where: {
      period_id: id, // Assuming 'id' is the primary key of the Period model
      school_admin_id: school_admin_id
    }
  });
  if (!period) {
    throw new AppError('No period record found or you do not have permission for this record', 404);
  }
}

// update period
exports.updatePeriod = catchAsync(async (req, res, next) => {
  await checkIfBelongs(req.params.id, req.school_admin_id);

  req.body = filterObj(req.body, 'start_time', 'end_time');
  factory.updateOne(Period, 'period_id')(req, res, next);
});

// delete period
exports.deletePeriod = catchAsync(async (req, res, next) => {
  await checkIfBelongs(req.params.id, req.school_admin_id);
  factory.deleteOne(Period, 'period_id')(req, res, next);
})

 