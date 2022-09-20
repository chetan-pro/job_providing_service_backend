'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_hobbies extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  resume_hobbies.init({
    resume_id: DataTypes.INTEGER,
    hobbyName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'resume_hobbies',
    tableName: 'resume_hobbies',
  });
  return resume_hobbies;
};