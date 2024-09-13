// Database models
const { Class, SchoolAdmin, sequelize } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handlerFactory');


// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  const { class_name, description } = req.body;
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


// Read all classes
exports.getAllClasses = catchAsync(async (req, res, next) => {
  try {
    const classes = await Class.findAll( {where: { active: true }} );
    res.status(200).json({
      status: 'success',
      data: {
        class : classes
      },
    });
  } catch (error) {
    return next(new AppError('Failed to get all classes', 400));
  }
});


// Read a single class
exports.getClass = catchAsync(async (req, res, next) => {
    try {
        const { id } = req.params;
        const classId = await Class.findByPk(id);
        if (!classId) {
            return next(new AppError('Class not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                class: classId
            }
        });
    } catch (error) {
        return next(new AppError('Failed to get class', 400));
    }
});


// Update a class
exports.updateClass = catchAsync(async (req, res, next) => {
  try {
    const id = req.params.id
    const classToUpdate = await Class.findByPk(id);
    if (!classToUpdate) {
      return next(new AppError('Class not found', 404));
    }
    const updatedClass = await classToUpdate.update(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        class: updatedClass,
      },
    });
  } catch (error) {
    return next(new AppError('Failed to update class', 400));
  }
});

// Delete a class
exports.deleteClass = factory.deleteOne(Class, 'class_id');