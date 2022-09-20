'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Testimonials extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Testimonials.hasOne(models.state, {
                    sourceKey: 'state_id',
                    foreignKey: 'id',
                }),
                Testimonials.hasOne(models.city, {
                    sourceKey: 'city_id',
                    foreignKey: 'id',
                })
        }
    }
    Testimonials.init({
        name: DataTypes.STRING,
        image: DataTypes.STRING,
        message: DataTypes.STRING,
        state_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'state',
                key: 'id',
            },
        },
        city_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'city',
                key: 'id',
            },
        },
    }, {
        sequelize,
        modelName: 'Testimonials',
    });
    return Testimonials;
};