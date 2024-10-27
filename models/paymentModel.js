const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    // instance or class methods here if needed
  }

  Payment.init(
    {
      payment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      payment_method: {
        type: DataTypes.STRING, // e.g., 'credit_card', 'paypal', etc.
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.ENUM('successful', 'failed', 'pending'),
        defaultValue: 'pending',
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'payment',
      timestamps: true,
      underscored: true,
    }
  );

  // Define associations
  Payment.associate = (models) => {
    Payment.belongsTo(models.Admin, {
      foreignKey: 'admin_id',
      as: 'Admin',
      onDelete: 'CASCADE',
    });

    Payment.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      as: 'Subscriptions',
      onDelete: 'CASCADE',
    });
  };

  return Payment;
};
