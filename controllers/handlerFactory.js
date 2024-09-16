// Import error controller
const catchAsync = require('../utils/catchAsync');

// Import AppError
const AppError = require('../utils/appError');

// Import API Features
const APIFeatures = require('../utils/apiFeatures');

// --------------------------------------------
// Create Factory Handler function :
// Reusable middleware functions for all routes.
// --------------------------------------------

// Create One
exports.createOne = (Model, popOptions = []) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body, { include: popOptions });

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// Get One
exports.getOne = (Model, idField, popOptions = [], additionalFilter={}) =>
  catchAsync(async (req, res, next) => {
    let options = {
      where: { [idField]: req.params.id },
      include: popOptions,
    };
    options.where = {...options.where, ...additionalFilter};
    const doc = await Model.findOne(options);

    if (!doc) {
      return next(new AppError(`No document found with that ${idField}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

// Get All Need to fix more flexible
exports.getAll = (Model, additionalFilter = {}, popOptions = []) =>
  catchAsync(async (req, res, next) => {
    let filter = { ...additionalFilter , active:1 };

    if (req.params.id) filter = { ...filter, id: req.params.id };

    const features = new APIFeatures(Model, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.exec({
      where: filter,
      include: popOptions,
    });

    if (!doc || doc.length === 0) {
      return next(new AppError('No documents found', 404));
    }

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: doc,
    });
  });

// Update One
exports.updateOne = (Model, idField) =>
  catchAsync(async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Update the record
      const [affectedRows] = await Model.update(updates, {
        where: { [idField]: id },
      });

      if (affectedRows === 0) {
        return next(
          new AppError(`No document found with that ${idField}`, 404)
        );
      }

      // Fetch the updated document
      const updatedDoc = await Model.findOne({ where: { [idField]: id } });

      res.status(200).json({
        status: 'success',
        data: updatedDoc,
      });
    } catch (err) {
      // Return a JSON error response
      next(new AppError('Server error, please try again later.', 500));
    }
  });

// Set active to false instead of deleting one record
exports.deleteOne = (Model, idField) =>
  catchAsync(async (req, res, next) => {
    console.log(
      `Attempting to set active to false for record with ${idField}: ${req.params.id}`
    );

    // Update the active field to false instead of deleting the record
    const doc = await Model.update(
      { active: false }, // Set active to false
      { where: { [idField]: req.params.id } }
    );

    // Check if the document exists and was updated
    if (doc[0] === 0) {
      console.error(`No document found with ${idField}: ${req.params.id}`);
      return next(new AppError(`No document found with that ${idField}`, 404));
    }

    // Respond with a success message
    res.status(200).json({
      status: 'success',
      message: `Record with ${idField}: ${req.params.id} successfully marked as inactive`,
    });
  });


// Delete a class
exports.deleteClass = catchAsync(async (req, res, next) => {
  try {
    const classToDelete = await Class.findByPk(req.params.id);
    
    if (!classToDelete) {
      return next(new AppError('No class found with that ID', 404));
    }
    await classToDelete.destroy();
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Class deleted successfully'
      },
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return next(new AppError('Failed to delete class', 400));
  }
});