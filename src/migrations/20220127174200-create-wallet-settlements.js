'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('wallet_settlements', {
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
            amount: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: "p:Pending,a:Approve,r:Reject"
            },
            transaction_id: {
                type: Sequelize.INTEGER,
            },
            file: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            update_by: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: "admin"
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            time: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
        await queryInterface.dropTable('wallet_settlements');
    }
};