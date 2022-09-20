'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subscribed_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      
      job_limit:{
        type: Sequelize.INTEGER,
      },
      
      email_limit:{
        type: Sequelize.INTEGER,
      },
      cv_limit:{
        type: Sequelize.INTEGER,
      },

      plan_type : {
          type : Sequelize.STRING,
          allowNull : false
      },

      job_boosting_days:{
        type: Sequelize.INTEGER,
      },

      free_plan_id :{
        type :  Sequelize.INTEGER,
        allowNull : true
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull:true
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull:true
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
    await queryInterface.dropTable('subscribed_users');
  }
};