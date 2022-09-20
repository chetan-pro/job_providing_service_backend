'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_days_jns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      day_id: {
        type: Sequelize.INTEGER
      },
      service_id: {
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('service_days_jns');
  }
};