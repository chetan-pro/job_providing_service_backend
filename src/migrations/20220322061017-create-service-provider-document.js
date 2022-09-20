'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_provider_documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      document_name: {
        type: Sequelize.STRING
      },
      document_number: {
        type: Sequelize.STRING
      },
      service_experience :{
        type :Sequelize.STRING,
      },
      image: {
        type: Sequelize.TEXT
      },
      image_back : {
        type :Sequelize.TEXT,
        allowNull:false
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
    await queryInterface.dropTable('service_provider_documents');
  }
};