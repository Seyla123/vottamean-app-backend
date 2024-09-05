module.exports = (sequelize, DataTypes) => {
  const Period = sequelize.define(
    'Period',
    {
      period_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      period_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'periods',
      timestamps: true,
      underscored: true,
    }
  );

  // Associate
  Period.associate = (models) => {
    Period.hasMany(models.Session, {
      foreignKey: 'period_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return Period;
};
