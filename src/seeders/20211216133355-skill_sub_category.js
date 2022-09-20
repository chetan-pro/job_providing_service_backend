'use strict';
const Constants = require('../services/Constants')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('skill_sub_categories', [
      {
        name: 'java',
        skill_category_id:'1',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'node',
        skill_category_id:'1',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'doctor',
        skill_category_id:'2',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'sister',
        skill_category_id:'2',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'animation',
        skill_category_id:'3',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'XYZ',
        skill_category_id:'3',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'ABC',
        skill_category_id:'2',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'PQR',
        skill_category_id:'1',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
