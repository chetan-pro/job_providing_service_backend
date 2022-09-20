'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      SubscriptionPlan.hasMany(models.TransactionHistory, {
        sourceKey: 'id',
        foreignKey: 'plan_id',
      })
      SubscriptionPlan.hasOne(models.Role, {
        sourceKey: 'user_role_type',
        foreignKey: 'role_type',
      })
      SubscriptionPlan.hasMany(models.SubscribedUser, {
        sourceKey: 'id',
        foreignKey: 'plan_id',
      })

    }
  };
  SubscriptionPlan.init({
    title:  DataTypes.STRING(100),
    description: DataTypes.TEXT,
    amount: DataTypes.INTEGER,
    expiry_days: DataTypes.INTEGER,
    user_role_type: {
      type: DataTypes.STRING,
    },
    offer : {
      type: DataTypes.STRING,
    },
    offer_type : DataTypes.STRING,
    discounted_amount :{
      type : DataTypes.INTEGER
    },
    job_limit : DataTypes.INTEGER,
    description_limit : DataTypes.INTEGER,
    plan_type : DataTypes.STRING,
    plan_type_area : DataTypes.STRING,
    plan_sub_type : DataTypes.STRING,
    job_boosting : DataTypes.STRING,
    job_boosting_days :{
      type : DataTypes.INTEGER,
      allowNull : true,
    },
    connected_free_metro_plan_id : DataTypes.INTEGER,
    connected_free_non_metro_plan_id : DataTypes.INTEGER,
    email_limit : DataTypes.INTEGER,
    cv_limit : DataTypes.INTEGER, 
    cashback_amount :{
      type :DataTypes.INTEGER
    },
    ref_amount_earned :{
      type :DataTypes.INTEGER
    },
    status :{
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    }
  }, {
    sequelize,
    timestamps:true,
    modelName: 'SubscriptionPlan',
    tableName:'subscription_plans',
  });
  return SubscriptionPlan;
};
