'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serviceCategoryJn extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      serviceCategoryJn.hasOne(models.ServiceCategory,{
        sourceKey:'category_id',
        foreignKey:'id'
      })
    }
  }
  serviceCategoryJn.init({
    category_id: DataTypes.INTEGER,
    service_id: DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'service_category_jns',
    modelName:'serviceCategoryJn',
  });
  return serviceCategoryJn;
};