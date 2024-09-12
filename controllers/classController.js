// Database models
const { Class, sequelize } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create a new class
exports.addClass = catchAsync(async (req, res, next) => {
  // field to input
  const { class_name, description } = req.body;
  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const newClass = await Class.create(
      {
        class_name,
        description,
        active: true,
      },
      { transaction }
    );
    await transaction.commit();

    res.status(201).json({
      status: 'success',
      data: {
        class: newClass,
      },
    });
  } catch (err) {
    await transaction.rollback();
    return next(new AppError('Failed to create class', 400));
  }
});

// Read all classes
exports.getAllClasses = catchAsync(async (req, res, next) => {
  try {
    const classes = await Class.findAll();
    res.status(200).json({
      status: 'success',
      data: {
        classes,
      },
    });
  } catch (error) {
    return next(new AppError('Failed to get all classes', 400));
  }
});


// Read a single class
exports.getClass = catchAsync(async(req, res, next) => {
    try {
        const classes = await Class.findbyPk(req.params.id);
        res.status(200).json({
            status: 'success',
            data: {
                classes
            }
        })
    } catch (error) {
        return next(new AppError('Failed to get class', 400));
    }
})
