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
        type: DataTypes.ENUM('basic', 'standard', 'premium'),
        allowNull: false,
        defaultValue: 'basic',
      },
      duration: {
        type: DataTypes.ENUM('trial', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'trial',
      },
      stripe_subscription_id: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: 'subscriptions',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Admin, {
      foreignKey: 'admin_id',
      as: 'Admin',
      onDelete: 'CASCADE',
    });
  };

  return Subscription;
};
