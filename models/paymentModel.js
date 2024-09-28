module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    Payment.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      as: 'subscription',
      onDelete: 'CASCADE',
    });
  };

  return Payment;
};
