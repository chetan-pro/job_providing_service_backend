'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      ServiceCategory.belongsToMany(models.service,{
        through:'service_category_jns',
        foreignKey:'category_id',
      })

    }
  }
  ServiceCategory.init({
    category_name: DataTypes.STRING,
    category_desc: DataTypes.TEXT,
    image : DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'ServiceCategory',
    tableName :'service_categories' 
  });
  return ServiceCategory;
};