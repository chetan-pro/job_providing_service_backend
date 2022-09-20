'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_reference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  resume_reference.init({
    resume_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    designation: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'resume_reference',
    tableName: 'resume_reference',
  });
  return resume_reference;
};