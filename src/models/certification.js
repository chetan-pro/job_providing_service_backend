'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Certification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Certification.hasMany(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
      })
    }
  };
  Certification.init({
    title: {
      type: DataTypes.STRING,
      allowNull:false
    },
    file_name:{
      type: DataTypes.STRING,
      allowNull:true
    },
    user_id:{
      type:DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    institute_name: {
      type: DataTypes.STRING,
      allowNull:false
    },
    year_of_achieving_certificate: {
      type: DataTypes.INTEGER,
      allowNull:false
    },
    file:{
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
    modelName: 'Certification',
    tableName:'certifications'
  });
  return Certification;
};