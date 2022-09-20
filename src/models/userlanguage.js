'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserLanguage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserLanguage.hasMany(models.Language, {
        sourceKey: 'language_id',
        foreignKey: 'id',
      })
      UserLanguage.hasMany(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
    }
  };
  UserLanguage.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    language_id: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'Language',
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
    modelName: 'UserLanguage',
    tableName:'user_languages'
  });
  return UserLanguage;
};