// Database models
const { Subject } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

// Create a new subject
exports.createSubject = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

  const newSubject = await Subject.create({
    name,
    description,
  });

  if (!newSubject) {
    return next(new AppError('Failed to create subject', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subject: newSubject,
    },
  });
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
