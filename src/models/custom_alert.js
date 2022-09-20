'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomAlert extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CustomAlert.hasOne(models.Industry, {
        sourceKey: 'industry_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.Sector, {
        sourceKey: 'sector_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.User, {
        sourceKey: 'company_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.state, {
        sourceKey: 'state_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.city, {
        sourceKey: 'city_id',
        foreignKey: 'id',
      })
      CustomAlert.hasOne(models.JobRoleType, {
        sourceKey: 'job_role_type_id',
        foreignKey: 'id',
      })
    }
  };
  CustomAlert.init({
    user_id:{
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    company_id:{
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    industry_id : {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Industry',
        key: 'id',
      },
    },
    sector_id : {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sector',
        key: 'id',
      },
    },
    job_role_type_id : {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'JobRoleType',
        key: 'id',
      },
    },
    state_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'state',
        key: 'id',
      },
    },
    city_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'city',
        key: 'id',
      },
    },
    pin_code:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'CustomAlert',
    tableName :'custom_alerts'
  });
  return CustomAlert;
};