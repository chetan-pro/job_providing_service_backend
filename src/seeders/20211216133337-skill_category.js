'use strict';
const Constants = require('../services/Constants')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('skill_categories', [
      {
        name: 'Software developer',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Medical',
        status:Constants.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Design',
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
