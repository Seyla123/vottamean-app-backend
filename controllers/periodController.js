// database
const { Period } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { filterObj } = require('../utils/filterObj');
const factory = require('./handlerFactory');

const checkIfBelongs = async (id, school_admin_id) => {
  // Validate the ID
  const period = await Period.findOne({
    where: {
      period_id: id, // Assuming 'id' is the primary key of the Period model
      school_admin_id: school_admin_id,
    },
  });
  if (!period) {
    throw new AppError(
      'No period record found or you do not have permission for this record',
      404
    );
  }
};

// check if any duplicate to prevent create the same period
const checkDuplicate = async (start_time, end_time , school_admin_id) => {
  const period = await Period.findOne({
    where: {
      start_time: start_time,
      end_time: end_time,
      school_admin_id : school_admin_id, 
      active : true
    },
  });
  if (period) {
    throw new AppError('Period already exists', 400);
  }
};

// Create Period
exports.createPeriod = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  const {start_time, end_time} = req.body;

  // filter the request body
  req.body = filterObj(req.body, 'start_time', 'end_time');
    // If no period with the same start and end time exists, create a new one
  req.body.school_admin_id = school_admin_id;

  await checkDuplicate(start_time, end_time, school_admin_id);

  await factory.createOne(Period)(req, res, next);
});

// fetch all period
exports.getAllPeriod = catchAsync(async (req, res, next) => {
  factory.getAll(Period, { school_admin_id: req.school_admin_id })(req,res,next);
});

// get period
exports.getPeriod = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  await checkIfBelongs(id, req.school_admin_id);

  factory.getOne(Period, 'period_id')(req, res, next);
});

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
});
