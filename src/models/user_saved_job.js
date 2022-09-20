'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSavedJobs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserSavedJobs.hasMany(models.JobPost, {
        sourceKey: 'job_post_id',
        foreignKey: 'id',
      })
      UserSavedJobs.hasOne(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
    }
  }
  UserSavedJobs.init({
    job_post_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'JobPost',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
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
    modelName: 'UserSavedJobs',
    tableName:'user_saved_jobs'
  });
  return UserSavedJobs;
};