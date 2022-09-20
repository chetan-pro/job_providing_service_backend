'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_applied_jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      job_post_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      hired_staff_id:{
        type: Sequelize.INTEGER,
        allowNull:true
      },
      reason:{
        type : Sequelize.TEXT,
        allowNull : true,
    },
      company_status: {
        type: Sequelize.STRING,
        comment: 'PENDING:PENDING,SHORTLISTED:shortlisted,SEND OFFER:SEND_OFFER,REJECT:REJECTED',
      },
      candidate_status:{
        type: Sequelize.STRING,
        comment:'APPLY_JOB:APPLY_JOB,REJECT_OFFER:REJECT_OFFER,ACCEPT_OFFER:ACCEPT_OFFER',
      },
      separate_resume: {
        type: Sequelize.TEXT,
        allowNull:true
      },
      offer_letter: {
        type: Sequelize.TEXT,
        allowNull:true
      },
      is_company_selected:{
        type: Sequelize.STRING,
        allowNull : true,
        comment: 'SEND OFFER:SEND_OFFER',
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_applied_jobs');
  }
};