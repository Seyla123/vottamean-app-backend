const AppError = require('./appError');
// Utility function to check if a record exists by primary key
exports.checkIfExists = async (Model, id, modelName) => {
  const record = await Model.findByPk(id);
  if (!record) {
    throw new AppError(`${modelName} with ID ${id} does not exist`, 400);
  }
  return record;
};
