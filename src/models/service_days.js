'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serviceDays extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */ 
    static associate(models) {

      serviceDays.belongsToMany(models.service,{
        through:'service_days_jns',
        foreignKey:'day_id',
      })

    }
  }
  serviceDays.init({
    day_name: {
      type:DataTypes.STRING,
      allowNull : false
    }
  }, {
    sequelize,
    tableName :'service_days',
    modelName: 'serviceDays',
  });
  return serviceDays;
};