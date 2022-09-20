'use strict';
const Constants = require('../services/Constants')
module.exports = {
  up: async (queryInterface, Sequelize) => {
     return queryInterface.bulkInsert('subscription_plans', [
      {
        title: 'abc',
        description:'prime',
        user_role_type:Constants.USER_ROLE_TYPE.company,
        amount:200,
        expiry_days:30,
        status:1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'pqr',
        description:'regular',
          user_role_type:Constants.USER_ROLE_TYPE.candidate,
          amount:400,
        expiry_days:90,
        status:1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
         {
             title: 'xyz',
             description:'regular',
             user_role_type:Constants.USER_ROLE_TYPE.company_staff,
             amount:400,
             expiry_days:90,
             status:1,
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
