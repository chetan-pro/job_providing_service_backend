'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_experience extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  resume_experience.init({
    resume_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    designation: DataTypes.STRING,
    description: DataTypes.STRING,
    from: DataTypes.INTEGER,
    to: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'resume_experience',
    tableName: 'resume_experience'
  });
  return resume_experience;
};