'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('job_role_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
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
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('job_role_types');
    }
};