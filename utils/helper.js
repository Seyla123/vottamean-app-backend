const AppError = require('./appError');
//Checking for belongs to admin id
exports.isBelongsToAdmin = async (id, field,school_admin_id,Model,field2, ModelName) => {
    // Validate the ID

    const additional = field2?{[field2]:school_admin_id} : {school_admin_id}
    const isExists = await Model.findOne({
      where: {
        [field]: id, // Assuming 'id' is the primary key of the model
        ...additional,
        active:true},
    });
    if (!isExists) {
      throw new AppError(
        `No ${ModelName ? ModelName : Model.name} record found `,
        404
      );
    }
    console.log(isExists);
    
};