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

/**
 * Middleware for creating a new document in a specified model.
 * Takes the request body to create a document and responds with the created document.
 *
 * @param {Model} Model - The model to create a document in.
 * @param {Array} [popOptions=[]] - Array of options to include related models.
 * @returns {Function} Middleware function for document creation.
 */
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

/**
 * Middleware for retrieving a single document by its ID.
 * Responds with the document if found; otherwise, passes an error to the next middleware.
 *
 * @param {Model} Model - The model to find the document in.
 * @param {string} idField - The field used to identify the document.
 * @param {Array} [popOptions=[]] - Array of options to include related models.
 * @param {Object} [additionalFilter={}] - Additional filters to apply.
 * @returns {Function} Middleware function for document retrieval.
 */
exports.getOne = (Model, idField, popOptions = [], additionalFilter = {}) =>
  catchAsync(async (req, res, next) => {
    let options = {
      where: { [idField]: req.params.id },
      include: popOptions,
    };
    options.where = { ...options.where, ...additionalFilter };
    const doc = await Model.findOne(options);

    if (!doc) {
      return next(new AppError(`No document found with that ${idField}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

/**
 * Middleware for retrieving all documents with filtering and pagination.
 * Responds with the documents found, or an error if none are found.
 *
 * @param {Model} Model - The model to retrieve documents from.
 * @param {Object} [additionalFilter={}] - Additional filters to apply.
 * @param {Array} [popOptions=[]] - Array of options to include related models.
 * @param {Array} [search=[]] - Fields to search within.
 * @returns {Function} Middleware function for retrieving all documents.
 */
exports.getAll = (
  Model,
  additionalFilter = {},
  popOptions = [],
  search = [],
  attribute
) =>
  catchAsync(async (req, res, next) => {
    let filter = { ...additionalFilter, active: 1 };

    if (req.params.id) filter = { ...filter, id: req.params.id };

    const features = new APIFeatures(Model, req.query)
      .filter()
      .search(search)
      .sort()
      .limitFields()
      .paginate()
      .includeAssociations(popOptions);
    if (attribute) features.options.attributes = attribute;
    
    const doc = await features.exec({
      where: filter,
      include: popOptions,
    });
    const totalCount = await features.count();

    if (!doc) {
      return next(new AppError('No documents found', 404));
    }

    res.status(200).json({
      status: 'success',
      results: totalCount,
      data: doc,
    });
  });

/**
 * Middleware for updating a document by its ID.
 * Responds with the updated document or an error if not found.
 *
 * @param {Model} Model - The model to update the document in.
 * @param {string} idField - The field used to identify the document.
 * @returns {Function} Middleware function for document update.
 */
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
      console.log('this is error :', err);

      next(new AppError('Server error, please try again later.', 500));
    }
  });

/**
 * Middleware for marking a document as inactive instead of deleting it.
 * Responds with a success message or an error if not found.
 *
 * @param {Model} Model - The model to mark the document in.
 * @param {string} idField - The field used to identify the document.
 * @returns {Function} Middleware function for marking document inactive.
 */
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

/**
 * Middleware for marking a document as active.
 * Responds with a success message or an error if not found.
 *
 * @param {Model} Model - The model to mark the document in.
 * @param {string} idField - The field used to identify the document.
 * @returns {Function} Middleware function for marking document inactive.
 */
exports.restoreOne = (Model, idField) =>
  catchAsync(async (req, res, next) => {
    console.log(
      `Attempting to restore record with ${idField}: ${req.params.id}`
    );

    // Ensure you're searching for users with active = false (inactive users)
    const doc = await Model.update(
      { active: true }, // Set active to true
      { where: { [idField]: req.params.id, active: false } }
    );

    // Check if the document exists and was updated
    if (doc[0] === 0) {
      console.error(
        `No inactive document found with ${idField}: ${req.params.id}`
      );
      return next(
        new AppError(`No inactive document found with that ${idField}`, 404)
      );
    }

    // Respond with a success message
    res.status(200).json({
      status: 'success',
      message: `Record with ${idField}: ${req.params.id} successfully restored`,
    });
  });

/**
 * Middleware for marking an array of selected -
 * row of the documents to turn it into inactive status.
 * Responds with a success message or an error if not found.
 *
 * @param {Model} Model - The model to mark the document in.
 * @param {string} idField - The field used to identify the document.
 * @returns {Function} Middleware function for marking document inactive.
 */
exports.deleteMany = (Model, idField) =>
  catchAsync(async (req, res, next) => {
    const idArr = req.body.ids;
    console.log(
      `Attempting to set active to false for records with ${idField}: ${idArr}`
    );

    // Update the active field to false instead of deleting the record
    try {
      const docs = await Model.update(
        { active: false }, // Set active to false
        { where: { [idField]: idArr, active: true, school_admin_id: req.school_admin_id } }
      );

      // Check if the document exists and was updated
      if (docs[0] === 0) {
        console.error(`No active document found with ${idField}: ${idArr}`);
        return next(new AppError(`No active document found with that ${idField}`, 404));
      }
      // Respond with a success message
      res.status(200).json({
        status: 'success',
        message: `${docs[0]} records with ${idField}: ${idArr} successfully marked as inactive`,
      });
    } catch (error) {
      return next(new AppError(`No active document found with that ${idField}`, 404));
    }
  });
