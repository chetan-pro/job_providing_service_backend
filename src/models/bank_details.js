'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class BankDetails extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            BankDetails.hasMany(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id',
            })
        }
    };
    BankDetails.init({
        bank_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        branch_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        full_registered_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ifsc_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bank_account_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bank_account_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '0:inactive,1:active,2:delete',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'BankDetails',
        tableName: 'bank_details'
    });
    return BankDetails;
};