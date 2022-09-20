'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('not_interested', {
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
    await queryInterface.dropTable('not_interested');
  }
};
