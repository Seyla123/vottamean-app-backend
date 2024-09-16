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

const isBelongsToAdmin = require('../utils/isBelongsToAdmin');
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
  req.body.school_admin_id = school_admin_id;
  validateClassData, factory.createOne(Class)(req, res, next);
});

// Get all active classes
// exports.getAllClasses = factory.getAll(Class, { active: true }, [{ model: SchoolAdmin, as: 'SchoolAdmin' }]);
exports.getAllClasses = catchAsync(async (req, res, next) => {
  factory.getAll(
    Class,
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    { active: true , school_admin_id: req.school_admin_id }
  )(req, res,next);
});

// Get a single class
// exports.getClass = factory.getOne(
//   Class,
//   'class_id',
//   [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
//   { active: true }
// );
exports.getClass = catchAsync(async(req , res , next) => {
  factory.getOne(
    Class,
    'class_id',
    [{ model: SchoolAdmin, as: 'SchoolAdmin' }],
    {active: true, school_admin_id:req.school_admin_id}
  )(req, res,next);
})

// Check for belongs
// const checkIfBelongs = async (id, school_admin_id) => {
//   const classRecord = await Class.findOne({
//     where: {
//       class_id: id,
//       school_admin_id: school_admin_id
//     }
//   });
//   if (!classRecord) {
//     throw new AppError('No class record found or you do not have permission for this record', 404);
//   }
// }

// Update a class
exports.updateClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, req.school_admin_id);
  factory.updateOne(Class, 'class_id')(req, res, next);
});
// Delete the class
exports.deleteClass = catchAsync(async (req, res, next) => {
  await isBelongsToAdmin(req.params.id, req.school_admin_id);
  factory.deleteOne(Class, 'class_id')(req, res, next);
});
