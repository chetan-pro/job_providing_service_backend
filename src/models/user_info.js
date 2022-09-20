'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class userInfo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      userInfo.hasOne(models.User,{
        sourceKey :'user_id',
        foreignKey :'id'
      })
    }
  }
  userInfo.init({
    user_id : DataTypes.INTEGER,
    realtive_name: DataTypes.STRING,
    relative_relation: DataTypes.STRING,
    residence_no: DataTypes.STRING(15),
    office_no: DataTypes.STRING(15),
    whatsapp_no: DataTypes.STRING(15),
    current_status: DataTypes.STRING,
    education_qualification :  DataTypes.STRING,
    education_file : DataTypes.STRING,
    adhar_no: DataTypes.STRING,
    adhar_img_front: DataTypes.STRING,
    adhar_img_back: DataTypes.STRING,
    pan_no: DataTypes.STRING,
    pan_img_front: DataTypes.STRING,
    pan_img_back: DataTypes.STRING,
    // residential_address: DataTypes.STRING,
    residential_proof_name:DataTypes.STRING,
    residential_proof: DataTypes.STRING, 
    // education_qualification : DataTypes.INTEGER,
  },{
    sequelize,
    tableName:'user_infos',
    modelName: 'userInfo',
  });
  return userInfo;
};