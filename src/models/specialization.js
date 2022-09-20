'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Specialization extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Specialization.hasMany(models.Course, {
        sourceKey: 'course_id',
        foreignKey: 'id',
      })
      Specialization.hasMany(models.Education, {
        sourceKey: 'id',
        foreignKey: 'specialization_id',
      })
    }
  };
  Specialization.init({
    course_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'Course',
        key: 'id',
      },
    },
    name: {
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
    modelName: 'Specialization',
    tableName: 'specializations'
  });
  return Specialization;
};