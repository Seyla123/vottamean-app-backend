const { Model } = require('sequelize');
const validators = require('../validators/validators');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    // instance or class methods here if needed
  }

  Attendance.init(
    {
      attendance_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isValidDate: validators.isValidDate
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
      tableName: 'attendances',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Attendance.associate = (models) => {
    // Attendance belongs to a Student
    Attendance.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'Student',
      onDelete: 'CASCADE',
    });

    // Attendance belongs to a Session and a Status
    Attendance.belongsTo(models.Session, {
      foreignKey: 'session_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });

    // Attendance belongs to a Status
    Attendance.belongsTo(models.Status, {
      foreignKey: 'status_id',
      as: 'Status',
      onDelete: 'CASCADE',
    });
  };

  return Attendance;
};
