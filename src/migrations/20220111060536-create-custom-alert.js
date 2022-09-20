'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('custom_alerts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id : {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      company_id:{
        type: Sequelize.INTEGER,
        allowNull:true
      },
      industry_id : {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sector_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      job_role_type_id : {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      state_id:{
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      city_id:{
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      pin_code:{
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
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
    await queryInterface.dropTable('custom_alerts');
  }
};