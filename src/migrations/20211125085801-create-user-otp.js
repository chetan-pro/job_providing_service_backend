'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_otps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      otp: {
        type: Sequelize.INTEGER
      },
      otp_type: {
        type: Sequelize.TEXT,
        comment: '1-Email, 2-mobile',
      },
      otp_expiry: {
        defaultValue: null,
        type: Sequelize.DATE,
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING(200)
      },
      mobile: {
        allowNull: true,
        type: Sequelize.STRING(15),
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_otps');
  }
};