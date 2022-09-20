'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_infos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      realtive_name: {
        type: Sequelize.STRING
      },
      relative_relation: {
        type: Sequelize.STRING
      },
      user_id : {
        type: Sequelize.INTEGER
      },
      residence_no: {
        type: Sequelize.STRING(15)
      },
      office_no: {
        type: Sequelize.STRING(15)
      },
      whatsapp_no: {
        type: Sequelize.STRING(15)
      },
      current_status: {
        type: Sequelize.STRING
      },
      adhar_no: {
        type: Sequelize.STRING
      },
      adhar_img_front: {
        type: Sequelize.STRING
      },
      adhar_img_back: {
        type: Sequelize.STRING
      },
      pan_no: {
        type: Sequelize.STRING
      },
      pan_img_front: {
        type: Sequelize.STRING
      },
      pan_img_back: {
        type: Sequelize.STRING
      },
      // residential_address: {
      //   type: Sequelize.STRING
      // },
      residential_proof_name:{
        type: Sequelize.STRING
      },
      residential_proof: {
        type: Sequelize.STRING
      },
      education_qualification : {
        type: Sequelize.INTEGER
      },
      education_file :{
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
    await queryInterface.dropTable('user_infos');
  }
};