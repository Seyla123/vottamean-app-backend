module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      attendance_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'attendances',
      timestamps: true,
      underscored: true,
    }
  );

  /**
   * ASSOCIATE MODELS
   */
  Attendance.associate = (models) => {
    Attendance.belongsTo(models.Student, {
      foreignKey: 'student_id',
      as: 'Student',
      onDelete: 'CASCADE',
    });

    Attendance.belongsTo(models.Session, {
      foreignKey: 'session_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });

    Attendance.belongsTo(models.Status, {
      foreignKey: 'status_id',
      as: 'Status',
      onDelete: 'CASCADE',
    });
  };

  return Attendance;
};
