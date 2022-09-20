'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class StaticData extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    StaticData.init({
        key: DataTypes.STRING,
        html_data: DataTypes.STRING,
        label: DataTypes.STRING,
    }, {
        sequelize,
        tableName: 'staticdata',
        modelName: 'StaticData',
    });
    return StaticData;
};