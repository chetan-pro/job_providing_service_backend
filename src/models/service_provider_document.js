'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceProviderDocument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      ServiceProviderDocument.hasOne(models.User,{
        sourceKey:'user_id',
        foreignKey:'id',
      })

    }
  }
  ServiceProviderDocument.init({
    user_id:{
      type : DataTypes.INTEGER,
      allowNull:false
    },
    document_name: {
      type :DataTypes.STRING,
      allowNull:false
    },
    document_number: {
      type :DataTypes.STRING,
      allowNull:false
    },
    service_experience :{
      type :DataTypes.STRING,
      allowNull:false
    },
    image: {
      type :DataTypes.TEXT,
      allowNull:false
    },
    image_back : {
      type :DataTypes.TEXT,
      allowNull:false
    }
  }, {
    sequelize,
    tableName:'service_provider_documents',
    modelName: 'ServiceProviderDocument',
  });
  return ServiceProviderDocument;
};