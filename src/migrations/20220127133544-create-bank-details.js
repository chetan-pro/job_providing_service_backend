'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bank_details', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            bank_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            branch_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            full_registered_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            ifsc_code: {
                type: Sequelize.STRING,
                allowNull: false
            },
            bank_account_number: {
                type: Sequelize.STRING,
                allowNull: false
            },
            bank_account_type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
        await queryInterface.dropTable('bank_details');
    }
};