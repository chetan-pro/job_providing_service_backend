'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transaction_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull:false
      },
      tnx_id: {
        type: Sequelize.STRING,
        allowNull:true
      },
      payment_json_response: {
        type: Sequelize.STRING
      },
      payment_json_request: {
        type: Sequelize.STRING
      },
      subscribed_user_id: {
        type: Sequelize.INTEGER,
      },

      user_id:{
        type: Sequelize.INTEGER,
      },

      amount:{
        type: Sequelize.STRING,
        allowNull:false
      },
      plan_id:{
        type: Sequelize.INTEGER,
        allowNull:false
      },
      payment_type:{
        type: Sequelize.STRING,
        allowNull:true,
      },
      currency:{
        type: Sequelize.STRING,
        allowNull:true,
      },
      payment_status:{
        type: Sequelize.STRING,
        comment: 'success:SUCCESSED,failed:FAILED',
      },
      cron_update:{
        type: Sequelize.STRING,
        comment: 'Y:YES,N:NO',
      },
      cron_updated_time:{
        type: Sequelize.DATE,
        allowNull:true
      },
      status:{
        type: Sequelize.STRING,
        comment: 'done:DONE,pending:PENDING,cancel:CANCEL',
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
    await queryInterface.dropTable('transaction_histories');
  }
};