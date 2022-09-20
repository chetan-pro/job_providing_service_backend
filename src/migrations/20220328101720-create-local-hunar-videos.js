'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('local_hunar_videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      url: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      length : {
        type: Sequelize.STRING,
        allowNull: false,
      },
      views: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      approved: {
        type: Sequelize.STRING,
        defaultValue: 'p',
        comment: 'y:yes, n:no, p:pending, d:deleted'
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
    await queryInterface.dropTable('local_hunar_videos');
  }
};