module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define(
    'School',
    {
      school_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      school_phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      school_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'schools',
      timestamps: true,
      underscored: true,
    }
  );

  School.associate = (models) => {
    School.belongsToMany(models.Admin, {
      through: models.SchoolAdmin,
      foreignKey: 'school_id',
      as: 'Admins',
    });
  };

  return School;
};
