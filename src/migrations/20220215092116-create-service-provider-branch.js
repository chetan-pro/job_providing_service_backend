'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_provider_branches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      service_provider_id: {
        type: Sequelize.INTEGER
      },
      shop_name: {
        type: Sequelize.STRING
      },
      address1: {
        type: Sequelize.STRING
      },
      address2: {
        type: Sequelize.STRING
      },
      pin_code: {
        type: Sequelize.INTEGER
      },
      state_id: {
        type: Sequelize.INTEGER
      },
      city_id: {
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
    await queryInterface.dropTable('service_provider_branches');
  }
};