'use strict';
const Constants = require('../services/Constants')
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('roles', [{
                name: 'candidate',
                role_type: Constants.USER_ROLE_TYPE.candidate,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'company',
                role_type: Constants.USER_ROLE_TYPE.company,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'company staff',
                role_type: Constants.USER_ROLE_TYPE.company_staff,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'home service provider',
                role_type: Constants.USER_ROLE_TYPE.home_service_provider,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'home service seeker',
                role_type: Constants.USER_ROLE_TYPE.home_service_seeker,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'local hunar',
                role_type: Constants.USER_ROLE_TYPE.local_hunar,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'business correspondence',
                role_type: Constants.USER_ROLE_TYPE.business_correspondence,
                createdAt: new Date(),
                updatedAt: new Date(),
            }, {
                name: 'advisor',
                role_type: Constants.USER_ROLE_TYPE.advisor,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'cluster manager',
                role_type: Constants.USER_ROLE_TYPE.cluster_manager,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'field sales executive',
                role_type: Constants.USER_ROLE_TYPE.field_sales_executive,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])
    },


    down: async(queryInterface, Sequelize) => {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    }
};