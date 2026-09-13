'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create users table
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // 2. Add userId to existing Transactions table
    //    Nullable for now because existing transactions
    //    don't belong to a user yet.
    await queryInterface.addColumn('Transactions', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 3. Add category to existing Transactions table
    await queryInterface.addColumn('Transactions', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove category
    await queryInterface.removeColumn('Transactions', 'category');

    // Remove userId
    await queryInterface.removeColumn('Transactions', 'userId');

    // Remove users table
    await queryInterface.dropTable('users');
  },
};