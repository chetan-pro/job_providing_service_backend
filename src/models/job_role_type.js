'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class JobRoleType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      JobRoleType.hasOne(models.JobPost, {
        sourceKey: 'id',
        foreignKey: 'job_role_type_id',
      })
      JobRoleType.hasOne(models.CustomAlert, {
        sourceKey: 'id',
        foreignKey: 'job_role_type_id',
      })
    }
  }
  JobRoleType.init({
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
    modelName: 'JobRoleType',
    tableName:'job_role_types'
  });
  return JobRoleType;
};