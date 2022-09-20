'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('wallet_transactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            previous_amount: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            total_amount: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'C:Credit,D:Debit',
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            details: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            subscribed_user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
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
        await queryInterface.dropTable('wallet_transactions');
    }
};