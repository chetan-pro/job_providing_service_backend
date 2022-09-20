'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        ServiceImage.hasOne(models.service,{
          foreignKey:'id',
          sourceKey : 'service_id',
        })
    }
  }
  ServiceImage.init({
    image:{
      type:DataTypes.STRING,
      allowNull : false
    },
    service_id: {
      type : DataTypes.INTEGER,
      references:{
        model:'service',
        key:'id'
      }
    },
  }, {
    sequelize,
    tableName:'service_images',
    modelName:'ServiceImage',
  });
  return ServiceImage;
};