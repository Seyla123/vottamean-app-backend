// Database models
const { Subject } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


const {
    isValidName,
    isValidDescription,
  } = require('../validators/validators');
  
// Factory handler
const factory = require('./handlerFactory');

// Create a new subject
exports.createSubject = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

   // 2. Validate input fields using custom validators
   try {
    isValidName(name);
    isValidDescription(description);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }


  try {
    const newSubject = await Subject.create({
      name,
      description,
    });

    res.status(200).json({
      status: 'success',
      data: {
        subject: newSubject,
      },
    });
  } catch (error) {
    return next(new AppError('Error creating subject', 500));
  }
});

// Get all subjects
exports.getAllSubjects = factory.getAll(Subject);

// Get a subject by ID
exports.getSubjectById = factory.getOne(Subject, 'subject_id');

// Update a subject by ID
exports.updateSubject = factory.updateOne(Subject, 'subject_id');

// Delete a subject by ID
exports.deleteSubject = catchAsync(async (req, res, next) => {
  const subjectId = req.params.id;

  const deletedSubject = await Subject.destroy({
    where: { subject_id: subjectId },
  });

  if (!deletedSubject) {
    return next(new AppError('No subject found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Subject has been deleted',
  });
});