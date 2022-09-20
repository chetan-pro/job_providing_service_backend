'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class serviceDaysJn extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

    }
  }
  serviceDaysJn.init({
    day_id: DataTypes.INTEGER,
    service_id: DataTypes.INTEGER
  }, {
    sequelize,
    tableName:'service_days_jns',
    modelName:'serviceDaysJn',
  });
  return serviceDaysJn;
};

// serviceDaysJnId