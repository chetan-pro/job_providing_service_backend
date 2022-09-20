'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('current_bussinesses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id : {
        type : Sequelize.INTEGER,
        allowNull : false
      },
      current_bussiness: {
        type: Sequelize.STRING
      },
      bussiness_type: {
        type: Sequelize.STRING
      },
      bussiness_name: {
        type: Sequelize.STRING
      },
      // address: 
      // {
      //   type: Sequelize.TEXT
      // },

      house_name : {
        type: Sequelize.STRING
      },
      street_no_name : {
        type: Sequelize.STRING
      },
      ward : {
        type: Sequelize.STRING
      },
      municipality : {
        type: Sequelize.STRING
      },

      city_id: {
        type: Sequelize.INTEGER
      },
      state_id: {
        type: Sequelize.INTEGER
      },
      pincode: {
        type: Sequelize.INTEGER
      },
      bussiness_years: {
        type: Sequelize.INTEGER
      },
      dimensions: {
        type: Sequelize.STRING
      },
      bussiness_img: {
        type: Sequelize.STRING
      },
      infrastructure_available: {
        type: Sequelize.STRING
      },
      current_income_pa: {
        type: Sequelize.INTEGER
      },
      no_customers: {
        type: Sequelize.INTEGER
      },
      popular: {
        type: Sequelize.STRING
      },
      customers_served: {
        type: Sequelize.INTEGER
      },

      ref1_name: {
        type: Sequelize.STRING
      },
      ref1_occupation: {
        type: Sequelize.STRING
      },
      education_qualification : {
        type: Sequelize.STRING
      },
      ref1_address: {
        type: Sequelize.STRING
      },
      ref1_mobile: {
        type: Sequelize.STRING(15)
      },
      ref2_name: {
        type: Sequelize.STRING
      },
      ref2_occupation: {
        type: Sequelize.STRING
      },
      ref2_address: {
        type: Sequelize.STRING
      },
      ref2_mobile: {
        type: Sequelize.STRING(15)
      },
      name_towns: {
        type: Sequelize.STRING
      },
      no_towns: {
        type: Sequelize.INTEGER
      },
      achievement1: {
        type: Sequelize.STRING
      },
      achievement2: {
        type: Sequelize.STRING
      },
      achievement3: {
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
    await queryInterface.dropTable('current_bussinesses');
  }
};