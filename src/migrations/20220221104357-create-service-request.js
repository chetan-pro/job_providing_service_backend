'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      branch_id:{
        type: Sequelize.INTEGER,
        allowNull: false
      },
      service_id : {
        type : Sequelize.INTEGER,
        allowNull: false
      },
      request_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      service_provider_status: {
        type :Sequelize.STRING,
        allowNull : false,
        defaultValue:'PENDING',
        comment:'[ACCEPTED,REJECTED,cancel,COMPLETED,PENDING]'
      },
      user_status: {
        type :Sequelize.STRING,
        allowNull : false,
        comment:'[REQUEST,REJECT]'
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
    await queryInterface.dropTable('service_requests');
  }
};