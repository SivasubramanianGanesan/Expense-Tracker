'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  Transaction.init(
    {
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },

      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'Transactions',
    }
  );

  return Transaction;
};