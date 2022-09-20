'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_experiences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      currently_employed: {
        type: Sequelize.STRING,
        comment: 'Y:YES,N:NO',
        allowNull:true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      job_title: {
        type: Sequelize.STRING,
        allowNull:false
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull:false
      },
      industry_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      job_description: {
        type: Sequelize.TEXT,
        allowNull:false
      },
      date_of_joining: {
        type: Sequelize.DATE,
        allowNull:true
      },
      date_of_resigning: {
        type: Sequelize.DATE,
        allowNull:true
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
      salary_type:{
        type: Sequelize.STRING,
        comment: 'PA:ANNUAL,PM:MONTHLY',
        allowNull:true
      },
      current_salary:{
        type: Sequelize.INTEGER,
        allowNull:true
      },
      notice_period: {
        type: Sequelize.STRING,
        comment: 'Y:YES,N:NO',
        allowNull:true
      },
      notice_period_days: {
        type: Sequelize.INTEGER,
        allowNull:true
      },
      notice_period_type: {
        type: Sequelize.STRING,
        comment: 'D:DAYS,M:MONTH',
        allowNull:true
      },
      active_job: {
        type: Sequelize.STRING,
        comment: 'Y:YES,N:NO',
        allowNull:true
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
    await queryInterface.dropTable('work_experiences');
  }
};