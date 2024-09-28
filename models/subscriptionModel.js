// Subscription Model
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
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
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Subscription;
};
