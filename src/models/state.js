'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class state extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            state.hasMany(models.city, {
                sourceKey: 'id',
                foreignKey: 'state_id',
            })
            state.hasMany(models.User, {
                sourceKey: 'id',
                foreignKey: 'state_id',
            })
            state.hasMany(models.JobPost, {
                sourceKey: 'id',
                foreignKey: 'state_id',
            })
            state.hasMany(models.CustomAlert, {
                sourceKey: 'id',
                foreignKey: 'state_id',
            })

            state.hasMany(models.serviceProviderBranch, {
                sourceKey: 'id',
                foreignKey: 'state_id'
            })

        }
    };
    state.init({
        name: DataTypes.STRING,
        code: DataTypes.STRING,
        description: DataTypes.STRING,
        status: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'state',
    });
    return state;
};