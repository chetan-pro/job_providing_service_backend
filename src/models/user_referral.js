const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class UserReferral extends Model {
    static associate(models) {

      UserReferral.hasOne(models.User, {
        sourceKey: 'user_id',
        foreignKey: 'id',
        as : "registered_user"
      })
      UserReferral.hasOne(models.User, {
        sourceKey: 'ref_user_id',
        foreignKey: 'id',
        as : "registered_by"
      })

    }
  }
  UserReferral.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'User',
            key: 'id',
          },
        },
        ref_user_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'User',
            key: 'id',
          },
        },
      },
      {
        sequelize,
        timestamps: true,
        modelName: 'UserReferral',
        tableName: 'user_referral',
        indexes: [
          {
            unique: true,
            fields: ['user_id', 'ref_user_id'],
          },
        ],
      }
  )

  return UserReferral
}
