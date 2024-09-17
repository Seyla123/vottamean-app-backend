// Database models
const { Subject } = require('../models');

// Error handler
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Factory handler
const factory = require('./handlerFactory');

const { filterObj } = require('../utils/filterObj');

const checkIfBelongs = async (id, school_admin_id) => {
  // Validate the ID
  const subject = await Subject.findOne({
    where: {
      subject_id: id, // Assuming 'id' is the primary key of the Period model
      school_admin_id: school_admin_id,
    },
  });
  if (!subject) {
    throw new AppError(
      'No subject record found or you do not have permission for this record',
      404
    );
  }
};

// check if any duplicate to prevent create the same period
const checkDuplicate = async (name , school_admin_id) => {
  const subject = await Subject.findOne({
    where: {
      name: name,
      school_admin_id : school_admin_id, 
      active : true
    },
  });
  if (subject) {
    throw new AppError('Subject already exists', 400);
  }
};

// Create a new subject
exports.createSubject = catchAsync(async (req, res, next) => {
  const school_admin_id = req.school_admin_id; 
  const { name } = req.body;

  // filter the request body
  req.body = filterObj(req.body, 'name' , 'description');

  req.body.school_admin_id = school_admin_id;

  // If no subject with the same name exists, create a new one
  await checkDuplicate(name, school_admin_id);

  // create new subject
  await factory.createOne(Subject)(req, res, next);

});

// Get all subjects
exports.getAllSubjects = catchAsync(async (req, res, next) => {
  factory.getAll(Subject, { school_admin_id: req.school_admin_id })(req, res, next);
});

// Get a subject by ID
exports.getSubjectById = catchAsync(async (req, res, next) => {
  const subjectId = req.params.id;
  await checkIfBelongs(subjectId, req.school_admin_id);
  factory.getOne(Subject, 'subject_id')(req, res, next);
});

// Update a subject by ID
exports.updateSubject = catchAsync(async (req, res, next) => {
  const subjectId = req.params.id;
  await checkIfBelongs(subjectId, req.school_admin_id);
  factory.updateOne(Subject, 'subject_id')(req, res, next);
});

// Delete a subject by ID
exports.deleteSubject = catchAsync(async (req, res, next) => {
  const subjectId = req.params.id;
  await checkIfBelongs(subjectId, req.school_admin_id);
  factory.deleteOne(Subject, 'subject_id')(req, res, next);
});
