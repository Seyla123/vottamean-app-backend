module.exports = (sequelize, DataTypes) => {
  const Info = sequelize.define(
    'Info',
    {
      info_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photo: {
        type: DataTypes.STRING,
        defaultValue: 'default.jpg',
      },
      phone_number: {
        type: DataTypes.STRING,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'info',
      timestamps: true,
      underscored: true,
    }
  );

  /**
   * ASSOCIATE MODELS
   */
  Info.associate = (models) => {
    Info.hasOne(models.Admin, {
      foreignKey: 'info_id',
      as: 'Admin',
    });
    Info.hasOne(models.Teacher, {
      foreignKey: 'info_id',
      as: 'Teacher',
    });
    Info.hasOne(models.Student, {
      foreignKey: 'info_id',
      as: 'Student',
    });
  };

  return Info;
};
