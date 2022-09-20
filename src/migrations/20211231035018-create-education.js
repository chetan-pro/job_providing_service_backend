'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('education', {
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
      education_id:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      course_id:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      specialization_id:{
        type:Sequelize.INTEGER,
        allowNull:true
      },
      institute_name:{
        type:Sequelize.STRING,
        allowNull:false
      },
      year_of_passing:{
        type:Sequelize.INTEGER,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('education');
  }
};