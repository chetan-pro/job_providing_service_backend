const { User, Notification } = require("../../models");
const { Op } = require("sequelize");
const Joi = require("@hapi/joi");
const Helper = require('../../services/Helper')
const bcrypt = require('bcrypt');
let pluck = require('arr-pluck');
const {
    USER_ROLE_TYPE
} = require('../../services/Constants');


module.exports = {

    getNotificationPage: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/Notification/sendNotification", {
            message,
            error,
            formValue
        });
    },

    // sendPushNotification: (text, toIds, type) => {
    //     toIds = toIds.filter(function(r) {
    //         if (r && r != 'null') {
    //             if (r.length > 10)
    //                 return r
    //         }
    //     });

    //     if (!toIds.length) return;
    //     console.log(toIds);
    //     // fcm token has limit 1000 tokens so we are make chunk of multiple array of 999 limit
    //     var i, j, tokenArray = [],
    //         chunk = 999;
    //     for (i = 0, j = toIds.length; i < j; i += chunk) {
    //         tokenArray.push(toIds.slice(i, i + chunk));
    //     }

    //     var message = {
    //         registration_ids: [],
    //         // collapse_key: 'your_collapse_key',

    //         notification: {
    //             title: text.title,
    //             body: text.body
    //         },

    //         data: {
    //             type: type
    //         }

    //     };

    //     console.log('tokenArray ', tokenArray);

    //     tokenArray.forEach((value) => {
    //         message.registration_ids = value;

    //         console.log('message data ', message);

    //         fcm.send(message, function(err, response) {
    //             if (err) {
    //                 console.log("Something has gone wrong! ", err);
    //             } else {
    //                 console.log("Successfully sent with response: ", response);
    //             }
    //         });
    //     })

    //     return true;

    // },

    sendNotification: async(req, res) => {
        const formValue = req.flash('formValue')[0];
        const reqParam = req.body
        const options = {
            where: {}
        }

        const schema = Joi.object({
            title: Joi.string().trim().required(),
            message: Joi.string().trim().required(),
            notification_type: Joi.string().required(),
            status: Joi.string().trim().required(),
            receiver: Joi.string().trim().required(),
        })
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            console.log(error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            if (reqParam.receiver == 'All') {
                console.log('Receiver ::::', reqParam.receiver);
            } else {
                console.log('Receiver ::::', reqParam.receiver)
                options['where'] = { user_role_type: reqParam.receiver }
            }

            User.findAndCountAll(options)
                .then((alldata) => {
                    // return res.send(alldata)
                    var tokens = pluck(alldata.rows, 'fcm_token').filter(e => e != null);
                    var i, j, tokenArray = [],
                        chunk = 999;
                    for (i = 0, j = tokens.length; i < j; i += chunk) {
                        tokenArray.push(tokens.slice(i, i + chunk));
                    }
                    var notification = {};
                    alldata.rows.forEach(element => {
                        var notification = {
                            title: reqParam.title,
                            message: reqParam.message,
                            notification_type: reqParam.notification_type,
                            status: reqParam.status,
                            user_id: element.id
                        }
                        Notification.create(notification)
                            .then((createdNotification) => {})
                            .catch((err) => {
                                console.log('ERROR:::', err);
                                req.flash('error', 'Some error occured')
                                res.redirect(req.header('Referer'))
                            })
                    });

                    tokenArray.forEach((value) => {
                        console.log("hello chetan this are the tokens", value);
                        Helper.pushNotification(notification, value)
                    });
                    req.flash('success', 'Notification Sent')
                    res.redirect(req.header('Referer'))
                })
        }
    },

}