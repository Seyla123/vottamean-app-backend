const { Model } = require('sequelize');
const validators = require('../validators/validators');

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    // instance or class methods here if needed
  }

  Class.init(
    {
      class_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      class_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: validators.isValidClassName,
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
      tableName: 'classes',
      timestamps: true,
      underscored: true,
    }
  );

  Class.associate = (models) => {
    // Class belongs to a School Admin
    Class.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
    });

    // Class has many Students
    Class.hasMany(models.Student, {
      foreignKey: 'class_id',
      as: 'Students',
      onDelete: 'CASCADE',
    });

    // Class has many Sessions
    Class.hasMany(models.Session, {
      foreignKey: 'class_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Class;
};
