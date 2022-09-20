'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Role extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Role.hasOne(models.User, {
                sourceKey: 'role_type',
                foreignKey: 'user_role_type',
            })
            Role.belongsToMany(models.User, {
                through: 'user_roles',
                sourceKey: 'role_type',
                // targetKey: 'roletype',
                foreignKey: 'roleType'
            })
            Role.hasMany(models.SubscriptionPlan, {
                sourceKey: 'role_type',
                foreignKey: 'user_role_type',
            })
        }
    };
    Role.init({
        name: DataTypes.STRING,
        role_type: DataTypes.STRING,
        show: DataTypes.BOOLEAN

    }, {
        sequelize,
        timestamps: true,
        modelName: 'Role',
        tableName: 'roles',
        indexes: [{
            unique: true,
            fields: ['role_type'],
        }, ],
    });
    return Role;
};