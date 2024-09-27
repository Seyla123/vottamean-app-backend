const { Model } = require('sequelize');
const { trimWhiteSpaces } = require('../utils/trimWhiteSpaces');
const infoValidator = require('../validators/infoValidator');

module.exports = (sequelize, DataTypes) => {
  class Info extends Model {
    // instance or class methods here if needed
  }

  Info.init(
    {
      info_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidName,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidName,
      },
      gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
        validate: infoValidator.isValidGender,
      },
      photo: {
        type: DataTypes.STRING,
        validate: infoValidator.isValidPhoto,
      },
      phone_number: {
        type: DataTypes.STRING,
        validate: infoValidator.isValidPhoneNumber,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidAddress,
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          customValidator(value) {
            infoValidator.isValidDOB(value);
          },
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'info',
      timestamps: true,
      underscored: true,
    }
  );

  Info.associate = (models) => {
    Info.hasOne(models.Admin, {
      foreignKey: 'info_id',
      as: 'Admin',
    });
    Info.hasOne(models.Teacher, {
      foreignKey: 'info_id',
      as: 'Teacher',
    });
    Info.hasOne(models.Student, {
      foreignKey: 'info_id',
      as: 'Student',
    });
  };

  // Using the reusable hook
  Info.addHook(
    'beforeValidate',
    trimWhiteSpaces(['first_name', 'last_name', 'phone_number', 'address', 'photo'])
  );

  return Info;
};
