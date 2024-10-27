// Database models
const { Class, SchoolAdmin, Student, sequelize } = require('../models');

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
  const { class_name } = req.body;
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
  const { class_name, description } = req.body;
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

// Delete many classes
exports.deleteManyClass = catchAsync(async (req, res, next) => {
  factory.deleteMany(Class, 'class_id')(req, res, next);
});

exports.StudentClassFilter = catchAsync(async (req, res, next) => {
  const getAllClassInStudent = await Student.findAll({
    where:{
      school_admin_id: req.school_admin_id,
      active:true
    },
    include: [
      {
        model: Class,
        as: 'Class',
        attributes: [],
      },
    ],
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('Class.class_id')), 'class_id'],
      [sequelize.col('Class.class_name'), 'class_name'],
    ],
    group: ['Class.class_id'],
    raw: true

  });
  const getAllClass = await Class.findAll({
    where: { school_admin_id: req.school_admin_id, active: true },
    attributes: ['class_id', 'class_name'],
    raw: true
  })

  // Combine both arrays and filter for unique `class_id`
  const combinedClasses = [...getAllClassInStudent, ...getAllClass];
  const uniqueClasses = combinedClasses.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.class_id === value.class_id
    ))
  );

  res.status(200).json({
    status: 'success',
    length: getAllClassInStudent.length,
    data: uniqueClasses,
  })
})