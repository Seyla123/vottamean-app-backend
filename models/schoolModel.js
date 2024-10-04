const { Model } = require('sequelize');
const validators = require('../validators/validators');
const infoValidator = require('../validators/infoValidator');

module.exports = (sequelize, DataTypes) => {
  class School extends Model {
    // instance or class methods here if needed
  }

  School.init(
    {
      school_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: validators.isValidSchoolName,
      },
      school_phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidPhoneNumber,
      },
      school_address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidAddress,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'schools',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  School.associate = (models) => {
    School.belongsToMany(models.Admin, {
      through: models.SchoolAdmin,
      foreignKey: 'school_id',
      as: 'Admins',
    });
  };

  return School;
};
