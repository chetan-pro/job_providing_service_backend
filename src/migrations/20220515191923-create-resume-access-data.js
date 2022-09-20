'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resume_access_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      user_subscribed_id: {
        type: Sequelize.INTEGER
      },
      email_downloaded: {
        type: Sequelize.STRING
      },
      cv_downloaded: {
        type: Sequelize.STRING
      },
      info_accessed_user_id:{
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
    await queryInterface.dropTable('resume_access_data');
  }
};
