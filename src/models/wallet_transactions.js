'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class WalletTransactions extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            WalletTransactions.hasMany(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id',
            })

            WalletTransactions.hasMany(models.SubscribedUser, {
                foreignKey: 'id',
                sourceKey: 'subscribed_user_id'
            })
        }
    }
    WalletTransactions.init({
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        previous_amount: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        total_amount: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'C:Credit,D:Debit',
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        details: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        subscribed_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        createdAt: {
            allowNull: false,
            type: DataTypes.DATE
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'WalletTransactions',
        tableName: 'wallet_transactions'
    });
    return WalletTransactions;
};