'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SubscribedUser extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            SubscribedUser.hasMany(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id',
                as: "subscribed_user"
            })
            SubscribedUser.hasOne(models.SubscriptionPlan, {
                sourceKey: 'plan_id',
                foreignKey: 'id',
            })
        }
    };
    SubscribedUser.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        plan_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        job_limit: DataTypes.INTEGER,
        email_limit: DataTypes.INTEGER,
        cv_limit: DataTypes.INTEGER,

        plan_type: {
            type: DataTypes.STRING,
            allowNull: false
        },

        job_boosting_days: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        free_plan_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATE,
            allowNull: true
        },

        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '0:inactive,1:active,2:delete',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'SubscribedUser',
        tableName: 'subscribed_users'
    });
    return SubscribedUser;
};