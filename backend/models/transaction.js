
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
        validate: {
          notEmpty: true,
        },
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },

      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },

      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

userId: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'users',
    key: 'id',
  },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
},
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'Transactions',
      timestamps: true,
    }
  );

  return Transaction;
};
