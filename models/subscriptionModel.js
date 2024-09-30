const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    // instance or class methods here if needed
  }

  Subscription.init(
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      plan_type: {
        type: DataTypes.ENUM('free', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'free',
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'canceled'),
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      tableName: 'subscription',
      timestamps: true,
      underscored: true,
    }
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.SchoolAdmin, {
      foreignKey: 'school_admin_id',
      as: 'SchoolAdmin',
      onDelete: 'CASCADE',
    });
  };

  return Subscription;
};
