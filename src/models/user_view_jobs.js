'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserViewJobs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserViewJobs.init({
    user_id:{
      type : DataTypes.INTEGER,
      allowNull:false
    } ,
    job_post_id: {
      type : DataTypes.INTEGER,
      allowNull: false
    } 
  }, {
    sequelize,
    tableName:'user_view_jobs',
    modelName: 'UserViewJobs',
  });
  return UserViewJobs;
};