'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class city extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      city.hasOne(models.state, {
        sourceKey: 'state_id',
        foreignKey: 'id',
      })
      city.hasMany(models.User, {
        sourceKey: 'id',
        foreignKey: 'city_id',
      })
      city.hasMany(models.JobPost, {
        sourceKey: 'id',
        foreignKey: 'city_id',
      })
      city.hasMany(models.CustomAlert, {
        sourceKey: 'id',
        foreignKey: 'city_id',
      })

      city.hasMany(models.serviceProviderBranch,{
        sourceKey:'id',
        foreignKey:'city_id'
      })

    }
  };
  city.init({
    name: DataTypes.STRING,
    state_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'state',
        key: 'id',
      }
    },
    description: DataTypes.STRING,
    status: DataTypes.INTEGER,
    is_metro : DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'city',
    tableName:'cities',
    indexes: [
      {
        unique: false,
        fields: ['state_id', 'status'],
      },
    ],
  });
  return city;
};