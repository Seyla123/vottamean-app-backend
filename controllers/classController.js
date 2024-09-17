// Database models
const { Class, SchoolAdmin } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// Factory handler
const factory = require('./handlerFactory');
// Utils
const { filterObj } = require('../utils/filterObj');

//  Checking for belongs to admin id
const { isBelongsToAdmin } = require('../utils/isBelongsToAdmin');

// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  // check if class already exists in the school
  const existingClass = await Class.findOne({
    where: {
      class_name: req.body.class_name,
      school_admin_id: req.school_admin_id,
    },
  });
  if (existingClass) {
    return next(new AppError('Class already exists', 400));
  }
  // filter the request body to only include class_name and description
  req.body = filterObj(req.body, 'class_name', 'description');
  req.body.school_admin_id = req.school_admin_id;
  // create new class
  factory.createOne(Class)(req, res, next);
});

// Get all active classes for the school
exports.getAllClasses = catchAsync(async (req, res, next) => {
  factory.getAll( Class,
    { school_admin_id: req.school_admin_id },
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    ['class_name', 'class_id'])(req, res, next); // Search by class_name and class_id
});

// Get a single class
exports.getClass = catchAsync(async (req, res, next) => {
  factory.getOne(
    Class, 'class_id',
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    { active: true, school_admin_id: req.school_admin_id })(req, res, next);
});

// Update a class
exports.updateClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, 'class_id', req.school_admin_id, Class);  // Check if belongs to admin
  req.body = filterObj(req.body, 'class_name', 'description'); // Filter out only class_name and description
  factory.updateOne(Class, 'class_id')(req, res, next);
});

// Delete the class
exports.deleteClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, 'class_id', req.school_admin_id, Class);
  factory.deleteOne(Class, 'class_id')(req, res, next);
});
