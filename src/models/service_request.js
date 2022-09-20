'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serviceRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      serviceRequest.hasOne(models.User,{
        foreignKey:'id',
        sourceKey:'user_id'
      })

      serviceRequest.hasOne(models.service,{
        foreignKey:'id',
        sourceKey:'service_id'
      })

      serviceRequest.hasMany(models.rateServiceRequest,{
        foreignKey:'service_request_id',
        sourceKey:'id'
      })

      serviceRequest.hasOne(models.serviceProviderBranch,{
        foreignKey:'id',
        sourceKey:'branch_id',
      })

    }
  }
  serviceRequest.init({
    user_id:{
      type :DataTypes.INTEGER,
      allowNull : false
    },
    service_id :{
      type : DataTypes.INTEGER,
      allowNull : false
    },
    branch_id:{
      type : DataTypes.INTEGER,
      allowNull : false
    },
    request_date:{
      type :DataTypes.DATE,
      allowNull : false
    },
    service_provider_status: {
      type :DataTypes.STRING,
      allowNull : false,
      defaultValue:'PENDING',
      comment:'[ACCEPTED,REJECTED,cancel,COMPLETED,PENDING]'

    },
    user_status:{
      type :DataTypes.STRING,
      allowNull : false,
      comment:'[REQUEST,REJECT]'
    }
  }, {
    sequelize,
    tableName:'service_requests',
    modelName: 'serviceRequest',
    timestamps:true
  });
  return serviceRequest;
};