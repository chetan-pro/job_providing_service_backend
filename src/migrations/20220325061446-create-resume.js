'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resume', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING
      },
      designation: {
        allowNull: true,
        type: Sequelize.STRING
      },
      about: {
        allowNull: true,
        type: Sequelize.STRING
      },
      description: {
        allowNull: true,
        type: Sequelize.STRING
      },
      contact: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      pin_code: {
        allowNull: true,
        type: Sequelize.TEXT,
        defaultValue: null
      },
      city_id: {
        allowNull: true,
        type: Sequelize.STRING
      },
      state_id: {
        allowNull: true,
        type: Sequelize.STRING
      },
      facebook: {
        allowNull: true,
        type: Sequelize.STRING
      },
      twitter: {
        allowNull: true,
        type: Sequelize.STRING
      },
      behance: {
        allowNull: true,
        type: Sequelize.STRING
      },
      instagram: {
        allowNull: true,
        type: Sequelize.STRING
      },
      linkedin: {
        allowNull: true,
        type: Sequelize.STRING
      },
      portfolio: {
        allowNull: true,
        type: Sequelize.STRING
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resume');
  }
};