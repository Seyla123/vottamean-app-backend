module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define(
    'Teacher',
    {
      teacher_id: {
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
      tableName: 'teachers',
      timestamps: true,
      underscored: true,
    }
  );

  Teacher.associate = (models) => {
    Teacher.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User',
    });

    Teacher.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
    });

    Teacher.hasOne(models.Info, {
      foreignKey: 'info_id',
      as: 'Info',
    });

    Teacher.hasMany(models.Session, {
      foreignKey: 'teacher_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Teacher;
};
