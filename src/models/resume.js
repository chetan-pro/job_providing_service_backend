'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class resumeBuilder extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here

            resumeBuilder.hasOne(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id'
            })

            resumeBuilder.hasMany(models.resume_education, {
                sourceKey: 'id',
                foreignKey: 'resume_id'
            })
            resumeBuilder.hasMany(models.resume_experience, {
                sourceKey: 'id',
                foreignKey: 'resume_id'
            })
            resumeBuilder.hasMany(models.resume_skills, {
                sourceKey: 'id',
                foreignKey: 'resume_id'
            })
            resumeBuilder.hasMany(models.resume_hobbies, {
                sourceKey: 'id',
                foreignKey: 'resume_id'
            })
            resumeBuilder.hasMany(models.resume_reference, {
                sourceKey: 'id',
                foreignKey: 'resume_id'
            })
            resumeBuilder.hasOne(models.state, {
                sourceKey: 'state_id',
                foreignKey: 'id'
            })
            // for city i.e city_id
            resumeBuilder.hasOne(models.city, {
                sourceKey: 'city_id',
                foreignKey: 'id'
            })

        }
    }
    resumeBuilder.init({
        user_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        designation: DataTypes.STRING,
        about: DataTypes.STRING,
        description: DataTypes.STRING,
        contact: DataTypes.STRING,
        email: DataTypes.STRING,
        address: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        pin_code: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        state_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'state',
                key: 'id'
            }
        },
        city_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'city',
                key: 'id'
            }
        },
        facebook: DataTypes.STRING,
        twitter: DataTypes.STRING,
        behance: DataTypes.STRING,
        instagram: DataTypes.STRING,
        linkedin: DataTypes.STRING,
        portfolio: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'resume',
        tableName: 'resume',
    });
    return resumeBuilder;
};