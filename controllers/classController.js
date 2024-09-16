// Database models
const { Class, SchoolAdmin } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// validators
const {
  isValidClassName,
  isValidDescription,
} = require('../validators/validators');

const { isBelongsToAdmin } = require('../utils/isBelongsToAdmin');

// validate class record 
const validateClassData = (req, res, next) => {
  const { class_name, description } = req.body;
  try {
    isValidClassName(class_name);
    isValidDescription(description);
    next();
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id;
  validateClassData(req, res, async () => {
    req.body.school_admin_id = school_admin_id;
    await factory.createOne(Class)(req, res, next);
  });
});

// Get all active classes
// exports.getAllClasses = factory.getAll(Class, { active: true }, [{ model: SchoolAdmin, as: 'SchoolAdmin' }]);
exports.getAllClasses = catchAsync(async (req, res, next) => {
  factory.getAll(
    Class,
    { school_admin_id: req.school_admin_id },
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }]
  )(req, res, next);
});

// Get a single class
// exports.getClass = factory.getOne(
//   Class,
//   'class_id',
//   [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
//   { active: true }
// );
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
  await isBelongsToAdmin(req.params.id, 'class_id', req.school_admin_id, Class);
  factory.updateOne(Class, 'class_id')(req, res, next);
});

// Delete the class
exports.deleteClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id , 'class_id', req.school_admin_id , Class);
  factory.deleteOne(Class, 'class_id')(req, res, next);
});
