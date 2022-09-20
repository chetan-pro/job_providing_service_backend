'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Industry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Industry.hasMany(models.JobPost, {
        sourceKey: 'id',
        foreignKey: 'industry_id',
      })
      Industry.hasMany(models.Sector, {
        sourceKey: 'id',
        foreignKey: 'industry_id',
      })
      Industry.hasMany(models.WorkExperience, {
        sourceKey: 'id',
        foreignKey: 'industry_id',
      })
      Industry.hasMany(models.CustomAlert, {
        sourceKey: 'id',
        foreignKey: 'industry_id',
      })
    }
  };
  Industry.init({
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
    modelName: 'Industry',
    tableName: 'industries'
  });
  return Industry;
};