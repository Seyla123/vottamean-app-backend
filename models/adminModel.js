const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    // instance or class methods here if needed
  }

  Admin.init(
    {
      admin_id: {
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
      tableName: 'admins',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Admin.associate = (models) => {
    // Admin belongs to a User
    Admin.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'User',
    });

    // Admin has many Schools through SchoolAdmin table
    Admin.belongsToMany(models.School, {
      through: models.SchoolAdmin,
      foreignKey: 'admin_id',
      as: 'School',
    });

    // Admin belongs to an Info
    Admin.belongsTo(models.Info, {
      foreignKey: 'info_id',
      as: 'Info',
    });

    // Admin has many subscriptions
    Admin.hasMany(models.Subscription, {
      foreignKey: 'admin_id',
      as: 'Subscriptions',
      onDelete: 'CASCADE',
    });

    // Admin has many payments
    Admin.hasMany(models.Payment, {
      foreignKey: 'admin_id',
      as: 'payments',
      onDelete: 'CASCADE',
    });
  };

  return Admin;
};
