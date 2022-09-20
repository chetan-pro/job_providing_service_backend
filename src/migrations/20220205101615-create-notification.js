'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull:false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notification_type:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id : {
        type : Sequelize.INTEGER,
        allowNull: false,
      },
      read_status : {
        type : Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue : false
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
    await queryInterface.dropTable('notifications');
  }
};
