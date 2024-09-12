const { Model } = require('sequelize');
const validators = require('../validators/validators');

module.exports = (sequelize, DataTypes) => {
  class Period extends Model {
    // instance or class methods here if needed
  }

  Period.init(
    {
      period_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      period_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: validators.isValidPeriodName,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Start time cannot be empty' },
        },
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'End time cannot be empty' },
          isAfterStartTime: validators.isAfterStartTime(
            'start_time',
            'end_time'
          ),
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
      tableName: 'periods',
      timestamps: true,
      underscored: true,
    }
  );

  Period.associate = (models) => {
    // Period belongs to a School Admin
    Period.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
    });

    // Period has many Sessions
    Period.hasMany(models.Session, {
      foreignKey: 'period_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Period;
};
