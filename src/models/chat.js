'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Chat extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here

            Chat.hasOne(models.ChatChannel,{
                sourceKey : 'chat_channel_id',
                foreignKey : 'id'
            })

        }
    }
    Chat.init({
        chat_channel_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        staff_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        read_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    }, {
        sequelize,
        modelName: 'Chat',
        tableName: 'chats',
    });
    return Chat;
};