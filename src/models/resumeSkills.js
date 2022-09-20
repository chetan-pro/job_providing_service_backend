'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_skills extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
        resume_skills.hasOne(models.SkillSubCategory, {
          sourceKey: 'skillSubCategory_id',
          foreignKey: 'id',
      })
    }
  }
  resume_skills.init({
    resume_id: DataTypes.INTEGER,
    skillSubCategory_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'SkillSubCategory',
            key: 'id',
        },
    },
    rating: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'resume_skills',
    tableName: 'resume_skills',
  });
  return resume_skills;
};