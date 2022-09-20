exports = module.exports = function(server) {
    const socketIO = require('socket.io');
    var users = [];
    const io = socketIO.listen(server, {
        path: "/hindustan-jobs",
        origins: "*:*",
    });
    io.on("connection", (socket) => {
        // emit when user gets online
        console.log("connected");
        console.log(socket.id, "has joined");

        socket.on('liveQuote', (data) => {
            console.log(data);
            io.emit('liveQuote', data);
        });


        socket.on('normalQuote', (data) => {
            console.log(data);
            io.emit('normalQuote', data);
        });
        socket.on("online", (data) => {
            let user = users.find(
                (d) => d.id == data.data.id && d.type == data.data.user_type
            );
            if (!user) {
                users.push({
                    type: data.data.user_type,
                    socket_id: socket.id,
                    id: data.data.id,
                    name: data.data.name,
                    avatar: data.data.image,
                });
            }
            io.emit("showOnline", users);
        });

        socket.on("join", (params) => {
            socket.join(params.pipeline_id);
        });

        socket.on("msgSeen", (params) => {
            if (params.type == "single") {
                socket.broadcast.emit(
                    `seen${params.newMessage.sender_type}_${params.newMessage.sender_id}`,
                    params
                );
            } else {
                socket.broadcast.emit(
                    `seen${params.newMessage[0].sender_type}_${params.newMessage[0].sender_id}`,
                    params
                );
            }
        });


        socket.on("leave", (params) => {
            socket.leave(params.pipeline_id);
        });

        socket.on("createMessage", (message, messageId, channelId, senderId, receiverId) => {
            console.log("createMessage");
            console.log(message);
            console.log(channelId);
            console.log(senderId);
            console.log(receiverId);

            console.log(`chat_channel_${channelId}`);
            socket.broadcast.emit(
                `chat_channel_${channelId}`, { message, messageId, senderId, channelId }
            );
            socket.broadcast.emit(
                `user_${receiverId}`, { message, senderId }
            );
        });

        socket.emit("me", socket.id);

    });
}