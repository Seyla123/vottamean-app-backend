const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    // instance or class methods here if needed
  }

  Session.init(
    {
      session_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'sessions',
      timestamps: true,
      underscored: true,
    }
  );

  Session.associate = (models) => {
    // Session belongs to a Status
    Session.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
      onDelete: 'CASCADE',
    });

    // Session belongs to a Teacher
    Session.belongsTo(models.Teacher, {
      foreignKey: 'teacher_id',
      as: 'Teacher',
      onDelete: 'CASCADE',
    });

    // Session belongs to a Class
    Session.belongsTo(models.Class, {
      foreignKey: 'class_id',
      as: 'Class',
      onDelete: 'CASCADE',
    });

    // Session belongs to a Subject
    Session.belongsTo(models.Subject, {
      foreignKey: 'subject_id',
      as: 'Subject',
      onDelete: 'CASCADE',
    });

    // Session belongs to a Period
    Session.belongsTo(models.Period, {
      foreignKey: 'period_id',
      as: 'Period',
      onDelete: 'CASCADE',
    });

    // Session belongs to a DayOfWeek
    Session.belongsTo(models.DayOfWeek, {
      foreignKey: 'day_id',
      as: 'DayOfWeek',
      onDelete: 'CASCADE',
    });
  };

  return Session;
};
