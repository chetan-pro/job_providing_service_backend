'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ChatChannel extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            ChatChannel.hasMany(models.Chat, {
                sourceKey: 'id',
                foreignKey: 'chat_channel_id',
            });
            ChatChannel.belongsTo(models.User, {
                sourceKey: 'id',
                as: 'senderInfo',
                foreignKey: 'sender_id',
            });
            ChatChannel.belongsTo(models.User, {
                sourceKey: 'id',
                as: 'receiverInfo',
                foreignKey: 'receiver_id',
            })
        }
    }
    ChatChannel.init({
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        receiver_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'ChatChannel',
        tableName: 'chat_channels',
    });
    return ChatChannel;
};