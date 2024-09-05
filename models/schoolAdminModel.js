module.exports = (sequelize, DataTypes) => {
  const SchoolAdmin = sequelize.define(
    'SchoolAdmin',
    {
      school_admin_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Principal',
      }, // e.g., 'Principal', 'Vice Principal'
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      tableName: 'school_admin',
      timestamps: true,
      underscored: true,
    }
  );

  SchoolAdmin.associate = (models) => {
    // Many-to-Many
    SchoolAdmin.belongsTo(models.Admin, {
      foreignKey: 'admin_id',
      as: 'Admin',
    });

    // Many-to-Many
    SchoolAdmin.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'School',
    });

    // One-to-Many
    SchoolAdmin.hasMany(models.Teacher, {
      foreignKey: 'school_admin_id',
      as: 'Teachers',
    });

    // One-to-Many
    SchoolAdmin.hasMany(models.Student, {
      foreignKey: 'school_admin_id',
      as: 'Students',
    });

    // One-to-Many
    SchoolAdmin.hasMany(models.Session, {
      foreignKey: 'school_admin_id',
      as: 'Sessions',
      onDelete: 'CASCADE',
    });
  };

  return SchoolAdmin;
};
