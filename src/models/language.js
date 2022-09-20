'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Language extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Language.hasMany(models.UserLanguage, {
        sourceKey: 'id',
        foreignKey: 'language_id',
      })
    }
  };
  Language.init({
    name: {
      type: DataTypes.STRING,
      allowNull:false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'Language',
    tableName: 'languages'
  });
  return Language;
};