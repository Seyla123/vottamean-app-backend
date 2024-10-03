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

  Payment.associate = (models) => {
    // Payment belongs to a School Admin
    Payment.belongsTo(models.Admin, {
      foreignKey: 'admin_id',
      as: 'Admin',
    });

    // Payment has many Sessions
    Payment.hasMany(models.Subscription, {
      foreignKey: 'payment_id',
      as: 'subscriptions',
      onDelete: 'CASCADE',
    });
  };

  return Payment;
};
