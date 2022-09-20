'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sector extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sector.hasMany(models.Industry, {
        sourceKey: 'industry_id',
        foreignKey: 'id',
      })
      Sector.hasMany(models.JobPost, {
        sourceKey: 'id',
        foreignKey: 'sector_id',
      })
      Sector.hasMany(models.CustomAlert, {
        sourceKey: 'id',
        foreignKey: 'sector_id',
      })
    }
  };
  Sector.init({
    industry_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Industry',
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
    modelName: 'Sector',
    tableName: 'sectors',
  });
  return Sector;
};