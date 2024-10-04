const { Model } = require('sequelize');
const { trimWhiteSpaces } = require('../utils/trimWhiteSpaces');
const infoValidator = require('../validators/infoValidator');
const validators = require('../validators/validators');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    // You can add instance or class methods here if needed
  }

  Student.init(
    {
      student_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      guardian_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidName,
      },
      guardian_email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidEmail,
      },
      guardian_relationship: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: validators.isValidGuardianRelationship,
      },
      guardian_phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidPhoneNumber,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'students',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Student.associate = (models) => {
    // Student belongs to a SchoolAdmin
    Student.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
      onDelete: 'SET NULL',
    });

    // Student belongs to a Class
    Student.belongsTo(models.Class, {
      foreignKey: 'class_id',
      as: 'Class',
      onDelete: 'CASCADE',
    });

    // Student belongs to Info (personal details)
    Student.belongsTo(models.Info, {
      foreignKey: 'info_id',
      as: 'Info',
      onDelete: 'CASCADE',
    });
  };

  // Using the reusable hook
  Student.addHook(
    'beforeValidate',
    trimWhiteSpaces([
      'guardian_name',
      'guardian_email',
      'guardian_phone_number',
    ])
  );

  return Student;
};
