// Database models
const { Class, SchoolAdmin } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// validators
const { isValidClassName, isValidDescription } = require('../validators/validators');
// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {1
  const { class_name, description } = req.body;

  try {
    isValidClassName(class_name)
    isValidDescription(description)
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
  // const school_admin_id = req.user.id; 
  const school_admin_id = 1
  try {
    const newClass = await Class.create({
      class_name,
      description,
      active: true,
      school_admin_id,
    });
    res.status(201).json({
      status: 'success',
      data: {
         newClass
      },
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return next(new AppError('Failed to create class', 400));
  }
});

// // Read all classes
// exports.getAllClasses = factory.getAll(Class, 'class_id', { active: true }, [
//   { model: SchoolAdmin, as: 'SchoolAdmin' },
// ]);

// //Read a single class
// exports.getClass = factory.getOne(Class, 'class_id', [
//   { model: SchoolAdmin, as: 'SchoolAdmin' },
// ]);

// Read all classes
// Read all classes
exports.getAllClasses = catchAsync(async (req, res, next) => {
  const classes = await factory.getAll(Class, { active: true }, [
    { model: SchoolAdmin, as: 'SchoolAdmin' },
  ])(req, res, next)
  res.status(200).json({
    status: 'success',
    data: classes,
  });
});
// Read a single class
exports.getClass = catchAsync(async (req, res, next) => {
  const classToGet = await factory.getOne(Class, 'class_id', [
    { model: SchoolAdmin, as: 'SchoolAdmin' },
  ])(req, res, next);

  // Check if the class is active
  if (!classToGet || !classToGet.active) {
    return next(new AppError('No active class found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: classToGet,
  });
});


// Update a class
exports.updateClass = factory.updateOne(Class, 'class_id');

// Delete a class
exports.deleteClass = catchAsync(async (req, res, next) => {
  const classToDelete = await Class.findByPk(req.params.id);
  if (!classToDelete) {
    return next(new AppError('No class found with that ID', 404));
  }
  if (classToDelete[0] === 0) {
    return next(new AppError('No class found with that ID', 404));
  }
  await classToDelete.update({ active: false });
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Class deleted successfully',
    }
  });
});