'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ResumeAccessData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ResumeAccessData.init({
    user_id: DataTypes.INTEGER,
    user_subscribed_id: DataTypes.INTEGER,
    email_downloaded: DataTypes.STRING,
    cv_downloaded: DataTypes.STRING,
    info_accessed_user_id : DataTypes.INTEGER,
  }, {
    sequelize,
    tableName :'resume_access_data',
    modelName: 'ResumeAccessData',
  });
  return ResumeAccessData;
};