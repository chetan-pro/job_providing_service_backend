'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Course.hasMany(models.Specialization, {
        sourceKey: 'id',
        foreignKey: 'course_id',
      })
      Course.hasMany(models.Education, {
        sourceKey: 'id',
        foreignKey: 'course_id',
      })
      Course.hasOne(models.EducationData, {
        sourceKey: 'education_id',
        foreignKey: 'id',
      })
    }
  };
  Course.init({
    name: {
      type: DataTypes.STRING,
      allowNull:false
    },
    education_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'EducationData',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'Course',
    tableName: 'courses'
  });
  return Course;
};