'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notification.hasOne(models.User,{
        foreignKey : 'id',
        sourceKey : 'user_id'
      })
    }
  }
  Notification.init({
    title: {
      type: DataTypes.STRING,
      allowNull:false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notification_type:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id : {
      type : DataTypes.INTEGER,
      allowNull: false,
    },
    read_status : {
      type : DataTypes.STRING,
      allowNull: false,
      defaultValue : false
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'Notification',
    tableName: 'notifications'
  });
  return Notification;
};