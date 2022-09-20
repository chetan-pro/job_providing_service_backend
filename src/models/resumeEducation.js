'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_education extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  resume_education.init({
    resume_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    from: DataTypes.INTEGER,
    to: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'resume_education',
    tableName: 'resume_education'
  });
  return resume_education;
};