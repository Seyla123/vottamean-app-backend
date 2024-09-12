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
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
        validate: infoValidator.isValidGender,
      },
      photo: {
        type: DataTypes.STRING,
        defaultValue: 'default.jpg',
        validate: {
          isUrl: { msg: 'Photo must be a valid URL' },
        },
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
          validator: function (value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              return false; // Invalid date
            }
            const day = date.getUTCDate();
            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();
            return (
              day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900
            );
          },
          message: 'Date of birth must include a valid day, month, and year',
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
    trimWhiteSpaces(['first_name', 'last_name', 'phone_number', 'address'])
  );

  return Info;
};
