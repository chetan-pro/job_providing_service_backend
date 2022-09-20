'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TransactionHistory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            TransactionHistory.hasOne(models.SubscriptionPlan, {
                    sourceKey: 'plan_id',
                    foreignKey: 'id',
                }),
                TransactionHistory.hasOne(models.SubscribedUser, {
                    sourceKey: 'subscribed_user_id',
                    foreignKey: 'id',
                })
        }
    };
    TransactionHistory.init({
        order_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tnx_id: {
            type: DataTypes.STRING,
        },
        payment_json_response: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payment_json_request: {
            type: DataTypes.STRING,
            allowNull: true
        },
        subscribed_user_id: {
            type: DataTypes.INTEGER,
        },
        total_amount: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0
        },
        e_amount: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0
        },
        wallet_amount: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0
        },
        plan_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        user_id: {
            type: DataTypes.INTEGER,
        },

        currency: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payment_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payment_status: {
            type: DataTypes.STRING,
            comment: 'success:SUCCESSED,failed:FAILED',
        },
        cron_update: {
            type: DataTypes.STRING,
            comment: 'Y:YES,N:NO',
        },
        cron_updated_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            comment: 'done:DONE,cancel:CANCEL',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'TransactionHistory',
        tableName: 'transaction_histories'
    });
    return TransactionHistory;
}