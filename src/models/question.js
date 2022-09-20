'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Question.hasOne(models.JobPost, {
        sourceKey: 'job_post_id',
        foreignKey: 'id',
      })
      Question.hasMany(models.Answers,{
        sourceKey:'id',
        foreignKey:'question_id'
      })
    }


  };
  Question.init({
    job_post_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'JobPost',
        key: 'id',
      },
    },
    questions: {
      type: DataTypes.STRING,
      allowNull:false
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'Question',
    tableName:'questions',
    indexes: [
      {
        unique: false,
        fields: ['job_post_id','status'],
      },
    ],
  });
  return Question;
};