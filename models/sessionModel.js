module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define(
    'Session',
    {
      session_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'sessions',
      timestamps: true,
      underscored: true,
    }
  );

  Session.associate = (models) => {
    Session.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
      onDelete: 'CASCADE',
    });

    Session.belongsTo(models.Teacher, {
      foreignKey: 'teacher_id',
      as: 'Teacher',
      onDelete: 'CASCADE',
    });

    Session.belongsTo(models.Class, {
      foreignKey: 'class_id',
      as: 'Class',
      onDelete: 'CASCADE',
    });

    Session.belongsTo(models.Subject, {
      foreignKey: 'subject_id',
      as: 'Subject',
      onDelete: 'CASCADE',
    });

    Session.belongsTo(models.Period, {
      foreignKey: 'period_id',
      as: 'Period',
      onDelete: 'CASCADE',
    });

    Session.belongsTo(models.DayOfWeek, {
      foreignKey: 'day_id',
      as: 'DayOfWeek',
      onDelete: 'CASCADE',
    });
  };

  return Session;
};
