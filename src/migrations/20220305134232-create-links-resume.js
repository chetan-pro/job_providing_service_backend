'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resume_links', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resume_id: {
        type: Sequelize.INTEGER
      },
      facebook: {
        type: Sequelize.STRING
      },
      twitter: {
        type: Sequelize.STRING
      },
      behance: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('resume_links');
  }
};
