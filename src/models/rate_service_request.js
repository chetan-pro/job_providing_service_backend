'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rateServiceRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      rateServiceRequest.hasOne(models.User,{
        foreignKey:'id',
        sourceKey:'user_id'
      })

      rateServiceRequest.hasOne(models.serviceRequest,{
        foreignKey:'id',
        sourceKey:'service_request_id'
      })

      rateServiceRequest.hasOne(models.service,{
        foreignKey :'id',
        sourceKey :'service_id'
      })

    }
  }
  rateServiceRequest.init({
    user_id:{
      type: DataTypes.INTEGER,
      allowNull : false,
    },
    service_id :{
      type : DataTypes.INTEGER,
      allowNull : false
    },
    service_request_id:{
      type : DataTypes.INTEGER,
      allowNull : false 
    },
    star:{
      type:DataTypes.INTEGER,
      allowNull : false 
    },
    comment: DataTypes.TEXT
  }, {
    sequelize,
    tableName:'rate_service_requests',
    modelName:'rateServiceRequest',
  });
  return rateServiceRequest;
};