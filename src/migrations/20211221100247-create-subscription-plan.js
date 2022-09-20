'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subscription_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull:false,
      },
      user_role_type: {
        type: Sequelize.STRING,
        allowNull:false,
      },
      amount: {
        type: Sequelize.STRING,
        allowNull:false
      },
      expiry_days: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      
      offer : {
        type : Sequelize.STRING,
      },

      offer_type :{
        type : Sequelize.STRING,
      },

      discounted_amount:{
        type: Sequelize.INTEGER,
      },
      job_limit:{
        type: Sequelize.INTEGER,
      },
      description_limit:{
        type: Sequelize.INTEGER,
      },
      plan_type:{
        type : Sequelize.STRING,
        comment: 'job_seeker_plan,home_service_provider_plans,resume_ data_access_plan',
      },
      plan_type_area :{
        type : Sequelize.STRING,
        comment: 'metro/non-metro',
      },
      plan_sub_type :{
        type : Sequelize.STRING,
        comment: 'classified/hot-vacancy',
      },

      // type to integer (discussion needed) 
      job_boosting:{
        type : Sequelize.STRING,
      },

      job_boosting_days :{
        type: Sequelize.INTEGER,
      },

      connected_free_metro_plan_id :{
        type: Sequelize.INTEGER,
      }, 
      connected_free_non_metro_plan_id :{
        type: Sequelize.INTEGER,
      },

      email_limit:{
        type: Sequelize.INTEGER,
      },
      cv_limit:{
        type: Sequelize.INTEGER,
      },
      
      cashback_amount :{
        type :Sequelize.INTEGER
      },
  
      ref_amount_earned :{
        type :Sequelize.INTEGER
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
    await queryInterface.dropTable('subscription_plans');
  }
};