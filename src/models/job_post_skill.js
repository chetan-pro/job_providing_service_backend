'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class JobPostSkill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      JobPostSkill.hasMany(models.JobPost, {
        sourceKey: 'job_post_id',
        foreignKey: 'id',
      })
      JobPostSkill.hasOne(models.SkillSubCategory, {
        sourceKey: 'skill_sub_category_id',
        foreignKey: 'id',
      })
    }
  };
  JobPostSkill.init({
    job_post_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'JobPost',
        key: 'id',
      },
    },
    skill_sub_category_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'SkillSubCategory',
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
    modelName: 'JobPostSkill',
    tableName: 'job_post_skills'
  });
  return JobPostSkill;
};