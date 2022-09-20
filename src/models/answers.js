'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Answers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      Answers.hasOne(models.Question,{
        sourceKey:'question_id',
        foreignKey:'id'
      })

      Answers.hasOne(models.User,{
        sourceKey:'user_id',
        foreignKey:'id'
      })

    }
  }
  Answers.init({
    user_id: {
      type:DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'User',
        key:'id'
      }
    },
    answer: {
      type:DataTypes.TEXT,
      allowNull:false
    },
    question_id:{
      type:DataTypes.STRING,
      allowNull:false,
      references:{
        model:'Question',
        key:'id'
      }
    } 
  }, {
    sequelize,
    tableName:'answers',
    modelName: 'Answers',
  });
  return Answers;
};