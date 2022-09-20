'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class company_env extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  company_env.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull:false
    },
    title: {
      type: DataTypes.STRING,
      allowNull:true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull:true
    },
    image: {
      type: DataTypes.STRING,
      allowNull:true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    },
  }, {
    sequelize,
    timestamps:true,
    modelName: 'CompanyEnv',
    tableName: 'company_env'

  });
  return company_env;
};