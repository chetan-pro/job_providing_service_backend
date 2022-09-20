'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class currentBussiness extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      currentBussiness.hasOne(models.User,{
        foreignKey :'id',
        sourceKey :'user_id'
      })

      currentBussiness.hasOne(models.city,{
        foreignKey :'id',
        sourceKey :'city_id'
      })

      currentBussiness.hasOne(models.state,{
        foreignKey :'id',
        sourceKey :'state_id'
      })
      
    }
  }
  currentBussiness.init({
    user_id : DataTypes.INTEGER,
    current_bussiness: DataTypes.STRING,
    bussiness_type: DataTypes.STRING,
    bussiness_name: DataTypes.STRING,
    // address: DataTypes.TEXT, 
    house_name : DataTypes.STRING,
    street_no_name : DataTypes.STRING,
    ward : DataTypes.STRING,
    municipality : DataTypes.STRING,
    city_id: DataTypes.INTEGER,
    state_id: DataTypes.INTEGER,
    pincode: DataTypes.INTEGER,
    bussiness_years: DataTypes.INTEGER,
    dimensions: DataTypes.STRING,
    bussiness_img: DataTypes.STRING,
    infrastructure_available: DataTypes.STRING,
    current_income_pa: DataTypes.INTEGER,
    no_customers: DataTypes.INTEGER,
    popular: DataTypes.STRING,
    customers_served: DataTypes.INTEGER,
    ref1_name: DataTypes.STRING,
    ref1_occupation: DataTypes.STRING,
    ref1_address: DataTypes.STRING,
    ref1_mobile: DataTypes.STRING(15),
    ref2_name: DataTypes.STRING,
    ref2_occupation: DataTypes.STRING,
    ref2_address: DataTypes.STRING,
    ref2_mobile: DataTypes.STRING(15),
    name_towns: DataTypes.STRING,
    no_towns: DataTypes.INTEGER,
    achievement1: DataTypes.STRING,
    achievement2: DataTypes.STRING,
    achievement3: DataTypes.STRING,
  }, {
    sequelize,
    tableName:'current_bussinesses',
    modelName: 'currentBussiness',
  });
  return currentBussiness;
};