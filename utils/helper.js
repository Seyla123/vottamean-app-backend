const AppError = require('./appError');
//Checking for belongs to admin id
exports.isBelongsToAdmin = async (id, field,school_admin_id,Model) => {
    // Validate the ID
    const isExists = await Model.findOne({
      where: {
        [field]: id, // Assuming 'id' is the primary key of the model
        school_admin_id,
      },
    });
    if (!isExists) {
      throw new AppError(
        `No ${Model.name} record found or you do not have permission for this record`,
        404
      );
    }
};