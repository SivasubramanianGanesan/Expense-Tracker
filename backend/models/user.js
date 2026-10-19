
'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      schema: 'public',
      freezeTableName: true,

      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },

        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.validPassword = async function (password) {
    const storedPassword = this.password;

    // Recognize standard bcrypt hashes.
    const isBcryptHash =
      /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword);

    if (!isBcryptHash) {
      // Temporary compatibility for legacy plaintext accounts.
      return password === storedPassword;
    }

    return bcrypt.compare(password, storedPassword);
  };

  return User;
};
