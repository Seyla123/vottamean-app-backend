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
const { isBelongsToAdmin } = require('../utils/helper');

// validation
const {
  isValidClassName,
  isValidDescription,
} = require('../validators/validators');

// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  const { class_name, description } = req.body;
  // Validate class_name and description
  if (!isValidClassName(class_name)) {
    return next(new AppError('Invalid class name', 400));
  }
  if (!isValidDescription(description)) {
    return next(new AppError('Invalid class description', 400));
  }
  // Check if class already exists in the school
  const existingClass = await Class.findOne({
    where: {
      class_name: class_name,
      school_admin_id: req.school_admin_id,
    },
  });
  if (existingClass) {
    return next(new AppError('Class already exists', 400));
  }
  // Filter the request body to only include class_name and description
  req.body = filterObj(req.body, 'class_name', 'description');
  req.body.school_admin_id = req.school_admin_id;
  // Create new class
  factory.createOne(Class)(req, res, next);
});

// Get all active classes for the school
exports.getAllClasses = catchAsync(async (req, res, next) => {
  factory.getAll(
    Class,
    { school_admin_id: req.school_admin_id },
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    ['class_name', 'class_id']
  )(req, res, next); // Search by class_name and class_id
});

// Get a single class
exports.getClass = catchAsync(async (req, res, next) => {
  factory.getOne(
    Class,
    'class_id',
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    { active: true, school_admin_id: req.school_admin_id }
  )(req, res, next);
});

// Update a class
exports.updateClass = catchAsync(async (req, res, next) => {
  const { class_name, description } = req.body
  // Validate class name
  if (!isValidClassName(class_name)) {
    return next(new AppError('Class name is required and must be valid', 400));
  }
  if (!isValidDescription(description)) {
    return next(new AppError('Description cannot exceed 255 characters', 400));
  }
  // Check if the class belongs to the admin
  await isBelongsToAdmin(req.params.id, 'class_id', req.school_admin_id, Class);
  // Filter out only class_name and description
  req.body = filterObj(req.body, 'class_name', 'description');
  // Update the class
  factory.updateOne(Class, 'class_id')(req, res, next);
});

// Delete the class
exports.deleteClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, 'class_id', req.school_admin_id, Class);
  factory.deleteOne(Class, 'class_id')(req, res, next);
});
