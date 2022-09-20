const { Op, QueryTypes } = require("sequelize");
const Seq = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const db = require("../../models/index");
const Joi = require("@hapi/joi");
const { Sequelize } = require("sequelize");
let pluck = require('arr-pluck');

const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    USER_IMAGE,
    ACTIVE,
    USER_ROLE_TYPE,
    DELETE,
    PER_PAGE,
} = require("../../services/Constants");
const { Chat, ChatChannel, User, Notification } = require("../../models");
const Mailer = require("../../services/Mailer");
const Constants = require("../../services/Constants");

module.exports = {
    sendMessage: async(req, res) => {
        const { authUserId, companyId } = req;
        const body = req.body;

        console.log("send message called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            sender_id: Joi.number().required(),
            receiver_id: Joi.number().required(),
            message: Joi.string().required(),
            user_role_type: Joi.string()
                .valid(
                    USER_ROLE_TYPE.candidate,
                    USER_ROLE_TYPE.advisor,
                    USER_ROLE_TYPE.staff,
                    USER_ROLE_TYPE.business_correspondence,
                    USER_ROLE_TYPE.cluster_manager,
                    USER_ROLE_TYPE.company,
                    USER_ROLE_TYPE.company_staff,
                    USER_ROLE_TYPE.field_sales_executive,
                    USER_ROLE_TYPE.home_service_provider,
                    USER_ROLE_TYPE.home_service_seeker,
                    USER_ROLE_TYPE.local_hunar
                )
                .required(),
        };

        const userDetails = await User.findByPk(authUserId);

        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(body);
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Add-staff ", error))
            );
        } else {
            let channelData = await ChatChannel.findOne({
                where: {
                    [Op.or]: [{
                            [Op.and]: [{
                                    sender_id: {
                                        [Op.eq]: body.sender_id,
                                    },
                                },
                                {
                                    receiver_id: {
                                        [Op.eq]: body.receiver_id,
                                    },
                                },
                            ],
                        },
                        {
                            [Op.and]: [{
                                    sender_id: {
                                        [Op.eq]: body.receiver_id,
                                    },
                                },
                                {
                                    receiver_id: {
                                        [Op.eq]: body.sender_id,
                                    },
                                },
                            ],
                        },
                    ],
                },
            });

            let channelCreated = null;
            if (!channelData) {
                try {
                    channelCreated = await ChatChannel.create({
                        sender_id: body.sender_id,
                        receiver_id: body.receiver_id,
                    });
                } catch (error) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Error while creating a channel"),
                        FAIL
                    );
                }
            }

            try {
                let messageCreated = await Chat.create({
                    chat_channel_id: !channelData ?
                        channelCreated.id : channelData.id,
                    user_id: body.user_role_type == USER_ROLE_TYPE.company_staff ?
                        companyId : body.sender_id,
                    staff_id: body.user_role_type == USER_ROLE_TYPE.company_staff ?
                        body.sender_id : null,
                    message: body.message,
                });

                // let chatData = await ChatChannel.findOne({
                //     where: {
                //         id: messageCreated.chat_channel_id,
                //     },
                //     include: [{
                //         model: User,
                //         as: "receiverInfo",
                //         attributes: ["id", "email","fcm_token","name"],
                //     },{
                //         model: User,
                //         as: "senderInfo",
                //         attributes: ["id", "email","fcm_token","name"],
                //     }
                //     , ],
                // });
                // let fcm;
                // let emails;
                // let name ;
                // let id ;
                // if(chatData.receiverInfo.id != messageCreated.user_id){
                //     id = chatData.receiverInfo.id
                //     emails = chatData.receiverInfo.email;
                //     fcm = chatData.receiverInfo.fcm_token;
                //     name = chatData.receiverInfo.name
                // }else{
                //     id = chatData.senderInfo.id
                //     emails = chatData.senderInfo.email;
                //     fcm = chatData.senderInfo.fcm_token;
                //     name = chatData.senderInfo.name
                //     }

                // let isCompany;
                // if(emails){
                //     isCompany = await User.findOne({
                //         where:{
                //         email : {
                //             [Op.eq] : emails
                //             }
                //         }
                //     })
                    
                //     }
                
                //     if(isCompany.user_role_type == 'COMPANY'){
                //         let staffDetails  = await User.findAll({
                //             where:{
                //                 company_id : {
                //                     [Op.eq] : 291
                //                 }
                //             }
                //         })  
                //         let staffEmails =  pluck(staffDetails,'email').filter(e => e != null)
                //         let staffFcm =  pluck(staffDetails,'fcm_token').filter(e => e != null)
                //         fcm = [ fcm,...staffFcm ];
                //         emails =[ emails, ...staffEmails ];
                //     }
                    
                //     let notification = {
                //         title: "Message Received",
                //         message: "You have received a message",
                //         notification_type: ACTIVE,
                //         status: ACTIVE,
                //         user_id : id
                //     };


                //     const locals = {
                //         username: name,
                //         appName: Helper.AppName,
                //         title:'MESSAGE RECEIVED',
                //     };
                
                //     Notification.create(notification).then(async result => {
                //         if (result) {
                //             try {
                //                 Helper.pushNotification(notification,fcm)
                //             } catch (error) {
                //                 console.log(error);
                //             }
                //         }
                //     });
                //     const mail = Mailer.sendMail(emails, 'Message Recieved!', Helper.messageSent, locals);

                return Response.successResponseData(
                    res,
                    messageCreated,
                    SUCCESS,
                    res.locals.__("Message send successfully"),
                );
            } catch (error) {
                console.log(error);
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("Error while sending a messsage"),
                    FAIL
                );
            }
        }
    },
    getMessage: async(req, res) => {

       const{authUserId}   = req;  

        const { chat_channel_id, page, sortBy } = req.query;
        console.log("get messages called");

        if (!chat_channel_id) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("Chat id is required"),
                FAIL
            );
        }

        let limit = 0;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ["id", sortBy != null ? sortBy : "ASC"]
        ];

        const options = {
            where: {
                chat_channel_id: chat_channel_id,
            },
            offset: offset,
            order: sorting,
        };

        if (limit) options["limit"] = limit;

        await Chat.update({
            read_status: true,
        },
        {
            where:{
                [Op.and] :[
                    {
                        chat_channel_id : chat_channel_id,
                    },
                    {
                        user_id :{
                            [Op.ne] : authUserId
                        }
                    }
                ]
            },
        })
        .then(data => console.log("updated , ", data))

        let allMessagesData = await Chat.findAndCountAll(options);

        console.log("message data :: ",allMessagesData);

        if (allMessagesData.rows.length > 0) {
            return Response.successResponseData(
                res,
                allMessagesData,
                SUCCESS,
                res.locals.__("Success"),
            );
        } else {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No message found"),
                FAIL
            );
        }
    },
    getAllContacts: async(req, res) => {
        const { page, sortBy, name } = req.query;
        const { authUserId, companyId, user_role_type } = req;
        let get =
            user_role_type == USER_ROLE_TYPE.company_staff ?
            companyId :
            authUserId;
  
        let limit = 0;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1;

        const offset = (pageNo - 1) * limit;
        // let sorting = [
        //     ["id", sortBy != null ? sortBy : "DESC"]
        // ];
        let sorting = [
            [Sequelize.col("chatLatestDate"), "DESC"]
        ];
        // let sorting = [
        //     [Chat, 'createdAt', 'DESC' ]
        // ];

        const options = {
            where: {
                [Op.or]: [{
                        sender_id: {
                            [Op.eq]: get,
                        },
                    },
                    {
                        receiver_id: {
                            [Op.eq]: get,
                        },
                    },
                ],
            },
            include: [
                {
                    model: User,
                    required : true,
                    as: "senderInfo",
                },
                {
                    model: User,
                    required : true,
                    as: "receiverInfo",
                },
                {
                    model: Chat,
                    where: {
                        read_status: false,
                    },
                    order: [
                        ["id", "DESC"]
                    ],
                    limit: 1
                },
            ],
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM chats AS chatters
                            WHERE
                            chatters.chat_channel_id = ChatChannel.id 
                            AND chatters.read_status =  false
                            AND chatters.user_id != ${authUserId}
                            
                        )`),
                        'badgeCount'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT createdAt FROM chats AS chatters
                            WHERE
                            chatters.chat_channel_id = ChatChannel.id
                            order by id desc limit 1
                        )`),
                        'chatLatestDate'
                    ]
                ],
            },
            offset: offset,
            order: sorting,
        };

        console.log("***options: ", options);
        if (limit) options["limit"] = limit;

        try {
            let allMessagesData = await ChatChannel.findAndCountAll(options);

            if (
                allMessagesData != undefined && allMessagesData.rows.length > 0) {
                return Response.successResponseData(
                    res,
                    allMessagesData,
                    SUCCESS,
                    res.locals.__("Success"),
                );
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No contacts found"),
                    FAIL
                );
            }
        } catch (error) {
            console.log(error);
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("Something wents wrong"),
                FAIL
            );
        }
    },
    seenMessage: async(req, res) => {
        const body = req.body;

        console.log("seen message called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            message_id: Joi.array().required(),
            channel_id: Joi.number().required(),
        };
        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(body);
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Seen-message", error))
            );
        } else {
            let chatData = await Chat.findAll({
                where: {
                    id: body.message_id,
                    chat_channel_id: body.channel_id,
                },
            });

            if (chatData.length == 0) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No message found"),
                    FAIL
                );
            }

            for (var i = 0; i < chatData.length; i++) {
                try {
                    await chatData[i].update({
                        read_status: true,
                    });
                } catch (error) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Something went wrong."),
                        FAIL
                    );
                }
            }

            return Response.successResponseWithoutData(
                res,
                res.locals.__("Message seen successfully"),
                SUCCESS
            );
        }
    },
    createChannel: async(req, res) => {
        const body = req.body;

        console.log("create channel called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            sender_id: Joi.number().required(),
            receiver_id: Joi.number().required(),
        };
        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(body);
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Seen-message ", error))
            );
        } else {
            try {
                let isChannelAlreadyExits = await ChatChannel.findOne({
                    where: {
                        [Op.or]: [{
                                [Op.and]: [{
                                        sender_id: {
                                            [Op.eq]: body.sender_id,
                                        },
                                    },
                                    {
                                        receiver_id: {
                                            [Op.eq]: body.receiver_id,
                                        },
                                    },
                                ],
                            },
                            {
                                [Op.and]: [{
                                        sender_id: {
                                            [Op.eq]: body.receiver_id,
                                        },
                                    },
                                    {
                                        receiver_id: {
                                            [Op.eq]: body.sender_id,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                });


                if (!isChannelAlreadyExits) {
                    await ChatChannel.create({
                        sender_id: body.sender_id,
                        receiver_id: body.receiver_id,
                    }).then((data) => {
                        isChannelAlreadyExits = data;
                    });
                }

                return Response.successResponseData(
                    res,
                    isChannelAlreadyExits,
                    SUCCESS,
                    res.locals.__("Channel created successfully"),
                );
            } catch (error) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("Something went wrong."),
                    FAIL
                );
            }
        }
    },
    deleteMessage: async(req, res) => {
        const body = req.body;

        console.log("delete message called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            message_id: Joi.array().required(),
            channel_id: Joi.number().required(),
        };
        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(body);
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Delete-message ", error))
            );
        } else {
            let chatData = await Chat.findAll({
                where: {
                    id: body.message_id,
                    chat_channel_id: body.channel_id,
                },
            });

            if (chatData.length == 0) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No message found"),
                    FAIL
                );
            }

            for (var i = 0; i < chatData.length; i++) {
                try {
                    await chatData[i].destroy();
                } catch (error) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Something went wrong."),
                        FAIL
                    );
                }
            }

            return Response.successResponseWithoutData(
                res,
                res.locals.__("Message deleted successfully"),
                SUCCESS
            );
        }
    },
    unseenMessages : async(req,res) =>{
        const { authUserId} = req;
        
        
        console.log("unseen-counts called !!!", authUserId);

        const options = {
            where: {
                [Op.or]: [{
                        sender_id: {
                            [Op.eq]: authUserId,
                        },
                    },
                    {
                        receiver_id: {
                            [Op.eq]: authUserId,
                        },
                    },
                ],
            },
            include: [
            {
                model: Chat,
                where: {
                    [Op.not]: [{
                        user_id: authUserId,
                    }, ],
                },
                // attributes:[]
            },
        ],
            attributes: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM chats AS chatters
                            WHERE
                            read_status = false
                            AND
                            chatters.chat_channel_id = ChatChannel.id 
                            AND chatters.user_id != ${authUserId}
                            
                        )`),
                        'unreadMessageCount'
                    ]
                ]
        };

        try {
            let allMessagesCount = await ChatChannel.findAll(options);
            let initialValue = 0;
            allMessagesCount.forEach(count => count.dataValues.unreadMessageCount ? initialValue += count.dataValues.unreadMessageCount : initialValue = initialValue )
            allMessagesCount = initialValue;

            if(allMessagesCount || allMessagesCount === 0){
                console.log("if:::::");
                return Response.successResponseData(
                    res,
                    allMessagesCount,
                    SUCCESS,
                    res.locals.__("Success"),
                );
            }else{
                console.log("else:::::");
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("Something wents wrong"),
                    FAIL
                );

            }
        } catch (error) {
            console.log(error);
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("Something wents wrong"),
                FAIL
            );
        }
    }
};