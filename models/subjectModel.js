const { Model } = require('sequelize');
const validators = require('../validators/validators');

module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
    // You can add instance or class methods here if needed
  }

  Subject.init(
    {
      subject_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subject_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: validators.isValidSubject,
      },
      description: {
        type: DataTypes.STRING,
        validate: validators.isValidDescription,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'subjects',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Subject.associate = (models) => {
    // Subject belongs to a School Admin
    Subject.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
      onDelete: 'SET NULL',
    });

    // Subject has many Sessions
    Subject.hasMany(models.Session, {
      foreignKey: 'subject_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Subject;
};
