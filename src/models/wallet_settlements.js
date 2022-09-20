'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class WalletSettlements extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            WalletSettlements.hasMany(models.User, {
                    sourceKey: 'user_id',
                    foreignKey: 'id',
                })
                // define association here
        }
    }
    WalletSettlements.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id',
            },
        },
        amount: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "p:Pending,a:Approve,r:Reject"
        },
        transaction_id: {
            type: DataTypes.INTEGER,
        },
        file: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        update_by: {
            type: DataTypes.STRING,
            comment: "admin"
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Date.now()
        }
    }, {
        sequelize,
        modelName: 'WalletSettlements',
        tableName: 'wallet_settlements'
    });
    return WalletSettlements;
};