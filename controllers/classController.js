// Database models
const { Class, SchoolAdmin } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  const { class_name, description } = req.body;
  const school_admin_id = req.params.admin_id; 
  const newClass = await Class.create({
    class_name,
    description,
    school_admin_id, 
  });

  res.status(201).json({
    status: 'success',
    data: {
      newClass,
    },
  });
});

// Update a class
exports.updateClass = factory.updateOne(Class, 'class_id');

// Get all active classes
exports.getAllClasses = catchAsync(async (req, res, next) => {
  const classes = await Class.findAll({
    where: { active: true },
    include: [{ model: SchoolAdmin, as: 'SchoolAdmin' }]
  });
  if (!classes || classes.length === 0) {
    return next(new AppError('No active classes found', 404));
  }
  res.status(200).json({
    status: 'success',
    results: classes.length,
    data: classes,
  });
});


// Get a single class
exports.getClass = catchAsync(async (req, res, next) => {
  const classToFetch = await Class.findOne({
    where: { 
      class_id: req.params.id,
      active: true 
    },
    include: [{ model: SchoolAdmin, as: 'SchoolAdmin' }]
  });

  if (!classToFetch) {
    return next(new AppError('No active class found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: classToFetch,
  });
});


// Delete the class
exports.deleteClass = catchAsync(async (req, res, next) => {
  const classToDelete = await Class.findByPk(req.params.id);
  
  if (!classToDelete) {
    return next(new AppError('No class found with that ID', 404));
  }

  await classToDelete.update({ active: false });

  res.status(200).json({
    status: 'success',
    message: 'Class deleted successfully',
  });
});
