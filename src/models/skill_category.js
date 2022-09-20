'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SkillCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SkillCategory.hasMany(models.SkillSubCategory, {
        sourceKey: 'id',
        foreignKey: 'skill_category_id',
      })
    }
  };
  SkillCategory.init({
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
    modelName: 'SkillCategory',
    tableName:'skill_categories'
  });
  return SkillCategory;
};