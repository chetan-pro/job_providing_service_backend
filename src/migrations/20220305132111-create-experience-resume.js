'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resume_experience', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resume_id: {
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      designation: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      from: {
        type: Sequelize.INTEGER
      },
      to: {
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
    await queryInterface.dropTable('resume_experience');
  }
};
