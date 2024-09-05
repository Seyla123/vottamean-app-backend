module.exports = (sequelize, DataTypes) => {
  const Status = sequelize.define(
    'Status',
    {
      status_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      status: {
        type: DataTypes.ENUM(
          'late',
          'present',
          'absent',
          'absent_with_permission'
        ),
        allowNull: false,
        defaultValue: 'absent',
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'status',
      timestamps: true,
      underscored: true,
    }
  );

  Status.associate = (models) => {
    Status.hasMany(models.Session, {
      foreignKey: 'day_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Status;
};
