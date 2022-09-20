'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkExperience extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      WorkExperience.hasMany(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
      WorkExperience.hasOne(models.Industry, {
        sourceKey: 'industry_id',
        foreignKey: 'id',
      })
    }
  };
  WorkExperience.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    currently_employed: {
      type: DataTypes.STRING,
      comment: 'Y:YES,N:NO',
      allowNull:true
    },
    job_title: {
      type: DataTypes.STRING,
      allowNull:false
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull:false
    },
    industry_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'Industry',
        key: 'id',
      },
    },
    job_description: {
      type: DataTypes.TEXT,
      allowNull:false
    },
    date_of_joining: {
      type: DataTypes.DATE,
      allowNull:true
    },
    date_of_resigning: {
      type: DataTypes.DATE,
      allowNull:true
    },
    current_salary:{
      type: DataTypes.INTEGER,
      allowNull:true
    },
    notice_period: {
      type: DataTypes.STRING,
      comment: 'Y:YES,N:NO',
      allowNull:true
    },
    notice_period_days: {
      type: DataTypes.INTEGER,
      allowNull:true
    },
    salary_type:{
      type: DataTypes.STRING,
      comment: 'PA:ANNUAL,PM:MONTHLY',
      allowNull:true
    },
    notice_period_type: {
      type: DataTypes.STRING,
      comment: 'D:DAYS,M:MONTH',
      allowNull:true
    },
    active_job: {
      type: DataTypes.STRING,
      comment: 'Y:YES,N:NO',
      allowNull:true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'WorkExperience',
    tableName:'work_experiences'
  });
  return WorkExperience;
};