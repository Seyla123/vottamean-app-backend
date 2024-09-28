const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Model } = require('sequelize');
const infoValidator = require('../validators/infoValidator');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    // Method to check if a provided password matches the stored hashed password
    async correctPassword(candidatePassword) {
      if (!candidatePassword) {
        return false;
      }
      if (!this.password) {
        return false;
      }
      return await bcrypt.compare(candidatePassword, this.password);
    }

    // Method to check if the password was changed after a certain timestamp
    changedPasswordAfter(JWTTimestamp) {
      if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
          this.passwordChangedAt.getTime() / 1000,
          10
        );
        return JWTTimestamp < changedTimestamp;
      }
      return false;
    }

    // Method to create a password reset token
    createPasswordResetToken() {
      const resetToken = crypto.randomBytes(32).toString('hex');

      this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      return resetToken;
    }

    // Method to create an email verification token
    createEmailVerificationToken() {
      const verificationToken = crypto.randomBytes(32).toString('hex');

      this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

      return verificationToken;
    }
  }

  User.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Email address already in use',
        },
        validate: infoValidator.isValidEmail,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: infoValidator.isValidPassword,
      },
      passwordConfirm: {
        type: DataTypes.VIRTUAL,
        validate: infoValidator.isPasswordConfirm,
      },
      role: {
        type: DataTypes.ENUM('admin', 'teacher'),
        allowNull: false,
        defaultValue: 'admin',
        validate: infoValidator.isValidRole,
      },
      passwordChangedAt: {
        type: DataTypes.DATE,
        validate: infoValidator.isValidDate,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        validate: infoValidator.isValidDate,
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
      },
      emailVerificationExpires: {
        type: DataTypes.DATE,
        validate: infoValidator.isValidDate,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
      defaultScope: {
        attributes: {
          exclude: [
            'password',
            'passwordConfirm',
            'passwordResetToken',
            'passwordResetExpires',
            'emailVerificationToken',
            'emailVerificationExpires',
          ],
        },
        where: {
          active: true,
        },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );

  // Hook to hash the password before saving a user
  User.addHook('beforeSave', async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
      user.passwordConfirm = undefined;

      // Update passwordChangedAt only if the user is not new
      if (!user.isNewRecord) {
        user.passwordChangedAt = new Date();
      }
    }
  });

  // Define associations
  User.associate = (models) => {
    // User has one Admin
    User.hasOne(models.Admin, {
      foreignKey: 'user_id',
      as: 'AdminProfile',
      onDelete: 'CASCADE',
    });

    // User has one Teacher
    User.hasOne(models.Teacher, {
      foreignKey: 'user_id',
      as: 'TeacherProfile',
      onDelete: 'CASCADE',
    });

    // User has many subscriptions
    User.hasMany(models.Subscription, {
      foreignKey: 'user_id',
      as: 'subscriptions',
      onDelete: 'CASCADE',
    });

    // User has many payments
    User.hasMany(models.Payment, {
      foreignKey: 'user_id',
      as: 'payments',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
