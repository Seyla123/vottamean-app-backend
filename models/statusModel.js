const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Status extends Model {
    // instance or class methods here if needed
  }

  Status.init(
    {
      status_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM(
          'late',
          'present',
          'absent',
          'permission'
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
      sequelize,
      tableName: 'status',
      timestamps: true,
      underscored: true,
    }
  );
  return Status;
};
