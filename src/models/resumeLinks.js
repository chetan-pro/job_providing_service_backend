'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resume_links extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  resume_links.init({
    resume_id: DataTypes.INTEGER,
    facebook: DataTypes.STRING,
    twitter: DataTypes.STRING,
    behance: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'resume_links',
    tableName: 'resume_links',
  });
  return resume_links;
};