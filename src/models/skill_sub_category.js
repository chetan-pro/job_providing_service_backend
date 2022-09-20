'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SkillSubCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SkillSubCategory.hasOne(models.SkillCategory, {
        sourceKey: 'skill_category_id',
        foreignKey: 'id',
      })
      SkillSubCategory.hasMany(models.JobPostSkill, {
        sourceKey: 'id',
        foreignKey: 'skill_sub_category_id',
      })
      SkillSubCategory.hasOne(models.UserSkill, {
        sourceKey: 'id',
        foreignKey: 'skill_sub_category_id',
      })
    }
  };
  SkillSubCategory.init({
    skill_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'SkillCategory',
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
    modelName: 'SkillSubCategory',
    tableName:'skill_sub_categories'
  });
  return SkillSubCategory;
};