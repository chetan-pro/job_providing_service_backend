'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  admin.init({
    username: {
      allowNull: true,
      type: DataTypes.STRING
    },
    email: {
      allowNull: true,
      type: DataTypes.STRING
    },
    reset_token: {
      type: DataTypes.TEXT(200),
      defaultValue: '',
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'admin',
    tableName: 'admins',
  });
  return admin;
};