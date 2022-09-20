"use strict";
const { WEEKDAYS } = require("../services/Constants");
module.exports = {
	async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('service_days', [
      {
        day_name: WEEKDAYS.MONDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.TUESDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.WEDNESDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.THURSDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.FRIDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.SATURDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        day_name: WEEKDAYS.SUNDAY,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
		
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
	},
};
