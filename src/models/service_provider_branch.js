'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serviceProviderBranch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      // for User i.e service_provider_id
      serviceProviderBranch.hasOne(models.User,{
        sourceKey:'service_provider_id',
        foreignKey:'id',
      })

      // for state i.e state_id
      serviceProviderBranch.hasOne(models.state,{
        sourceKey:'state_id',
        foreignKey:'id'
      })

      // for city i.e city_id
      serviceProviderBranch.hasOne(models.city,{
        sourceKey:'city_id',
        foreignKey:'id'
      })

      serviceProviderBranch.hasMany(models.serviceRequest,{
        sourceKey:'id',
        foreignKey:'branch_id'
      })
    }
  }
  serviceProviderBranch.init({
    service_provider_id: {
      type:DataTypes.INTEGER,
      allowNull:false,
     references:{
       model:'user',
       key:'id',
     }
    },
    shop_name: {
      type :DataTypes.STRING,
      allowNull:false
    },
    address1: {
      type :DataTypes.STRING,
      allowNull:false
    },
    address2: {
      type :DataTypes.STRING,
      allowNull:true
    },
    pin_code: {
      type :DataTypes.INTEGER,
      allowNull:false
    },
    state_id: {
      type:DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'state',
        key:'id'
      }
    },
    city_id:{
      type:DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'city',
        key:'id'
      }
    } 
  }, {
    sequelize,
    timestamps:true,
    modelName: 'serviceProviderBranch',
    tableName:'service_provider_branches',
  });
  return serviceProviderBranch;
};