// Database models
const { Class, sequelize } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.addClass = catchAsync(async (req, res, next) => {
    const { class_name, grade, description } = req.body;
  
    // Start a transaction
    const transaction = await sequelize.transaction();
  
    try {
      const newClass = await Class.create(
        {
          class_name,
          grade,
          description,
          active: true, 
        },
        { transaction }
      )
      // Commit transaction
      await transaction.commit();
  
      res.status(201).json({
        status: 'success',
        data: {
          class: newClass,
        },
      })
    } catch (err) {
      await transaction.rollback();
      return next(new AppError('Failed to create class', 400));
    }
  });
  