'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('certifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      title: {
        type: Sequelize.STRING,
        allowNull:false
      },
      file_name:{
        type: Sequelize.STRING,
        allowNull:true
      },
      institute_name: {
        type: Sequelize.STRING,
        allowNull:false
      },
      year_of_achieving_certificate: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      file:{
        type: Sequelize.STRING,
        allowNull:true
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
    await queryInterface.dropTable('certifications');
  }
};