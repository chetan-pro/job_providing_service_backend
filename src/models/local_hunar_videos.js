const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LocalHunarVideos extends Model {
  
    static associate(models) {
     
      LocalHunarVideos.hasOne(models.User,{
        sourceKey: 'user_id',
        foreignKey: 'id'
      })

    }
  }

  LocalHunarVideos.init({
    user_id: DataTypes.INTEGER,
    url:{
      type:DataTypes.TEXT,
      allowNull:false,
    },
    title:{
      type:DataTypes.STRING,
      allowNull:false,
    },
    description:{
      type:DataTypes.TEXT,
    },
    length : {
      type:DataTypes.STRING,
      allowNull: false,
    },
    views:{
      type:DataTypes.INTEGER,
    },
    approved:{
      type:DataTypes.STRING,
      defaultValue:'p',
      comment: 'y-yes, n-no, p-pending, d-deleted'
    },
    
  }, {
    sequelize,
    modelName: 'LocalHunarVideos',
    tableName: 'local_hunar_videos',
  });
  return LocalHunarVideos;
};