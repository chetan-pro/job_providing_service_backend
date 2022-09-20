'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EducationData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EducationData.hasOne(models.JobPost, {
        sourceKey: 'id',
        foreignKey: 'education_id',
      })
      EducationData.hasOne(models.Course, {
        sourceKey: 'id',
        foreignKey: 'education_id',
      })
    }
  };
  EducationData.init({
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
    modelName: 'EducationData',
    tableName: 'education_data',
  });
  return EducationData;
};