'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Education extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Education.hasMany(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
      Education.hasOne(models.Course, {
        sourceKey: 'course_id',
        foreignKey: 'id',
      })
      Education.hasOne(models.Specialization, {
        sourceKey: 'specialization_id',
        foreignKey: 'id',
      })
      Education.hasOne(models.EducationData, {
        sourceKey: 'education_id',
        foreignKey: 'id',
      })
    }
  };
  Education.init({
    user_id:{
      type:DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    education_id:{
      type:DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'EducationData',
        key: 'id',
      },
    },
    course_id:{
      type:DataTypes.INTEGER,
      allowNull:true,
      references: {
        model: 'Course',
        key: 'id',
      },
    },
    specialization_id:{
      type:DataTypes.INTEGER,
      allowNull:true,
      references: {
        model: 'Specialization',
        key: 'id',
      },
    },
    institute_name:{
      type:DataTypes.STRING,
      allowNull:false
    },
    year_of_passing:{
      type:DataTypes.INTEGER,
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
    modelName: 'Education',
    tableName: 'education'
  });
  return Education;
};