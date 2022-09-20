'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      service.hasOne(models.User,{
        foreignKey:'id',
        sourceKey:'service_provider_id'
      })

      service.hasMany(models.ServiceImage,{
        foreignKey:'service_id',
        sourceKey :'id',
      })

      service.belongsToMany(models.ServiceCategory,{
        through:'service_category_jns',
        foreignKey:'service_id',
      })

      service.belongsToMany(models.serviceDays,{
        through:'service_days_jns',
        foreignKey:"service_id",
      })

      service.hasMany(models.serviceRequest,{
        sourceKey:'id',
        foreignKey:'service_id'
      })

      service.hasMany(models.rateServiceRequest,{
        sourceKey :'id',
        foreignKey:'service_id'
      })

    }
  }
  service.init({
    service_provider_id:{
      type:DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'User',
        key:'id'
      }
    },
    service_name:{
      type:DataTypes.STRING,
      allowNull:false
    } ,
    service_charge: {
      type:DataTypes.INTEGER,
      allowNull:false
    },
    service_status:{
      type:DataTypes.STRING,
      allowNull:false,
      defaultValue : 'Y',
    }
  }, {
    sequelize,
    tableName:'services',
    modelName:'service',
  });
  return service;
};