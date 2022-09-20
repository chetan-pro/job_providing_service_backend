const { Op, where } = require("sequelize");
const path = require("path");
const fetch = require("node-fetch");
const bcrypt = require("bcrypt");
const fs = require("fs-extra");
const Jimp = require("jimp");
const moment = require("moment");
const CronJob = require('cron').CronJob;
const addSubtractDate = require("add-subtract-date");
const { Sequelize } = require("sequelize");
const { User, WorkExperience, Chat, ChatChannel, serviceRequest, service, SubscribedUser } = require("../models");
const Mailer = require("./Mailer")
let pluck = require('arr-pluck');

let { COMMISSION_AMOUNT } = require("../services/Constants")

const FCM = require("fcm-node");
const Response = require("../services/Response");
const Constants = require("../services/Constants");
const serviceAccount = require("../config/hindustaan-fcm-firebase.json");
const { FirebaseDynamicLinks } = require("firebase-dynamic-links");
const e = require("connect-flash");
const { ACTIVE } = require("../services/Constants");
const firebaseDynamicLinks = new FirebaseDynamicLinks(
    process.env.firebaseWebAppKey
);
var serverKey =
    "AAAAVLEA2W4:APA91bGKXd4zixXk3SPtRRjadAiWx0CafvZx_hAdovKLdHbkaBfHBujswb2XQ1gxnDYtZ_VWF-OaHBzX4aPeHh5LaLBWliUDI3HV2ecPVD3UHcVAC8h0cW33Gqf3Fg8OcggkyyKx_npQ"; //put your server key here
var fcm = new FCM(serverKey);

module.exports = {
    AppName: "Hindustaanjobs",
    forgotTemplate: "forgotPassword",
    supportTemplate: "customAlert",
    passwordChanged: "passwordChanged",
    userEmailVerification: "userEmailVerification",
    sendVerificationCode: "sendVerificationCode",
    acceptApplyJobMail: "acceptApplyJobMail",
    applyJobCandidate: "applyJobCandidate",
    acceptOfferCandidate: "acceptOfferCandidate",
    customAlertAdd: "customAlertAdd",
    rejectJobOffferCandidate: "rejectJobOffferCandidate",
    messageSent: "messageSent",
    rejectApplyJobMail: "rejectApplyJobMail",
    sendOfferLetter: "sendOfferLetter",
    addServiceRequest: "addServiceRequest",
    pendingServiceRequest: "pendingServiceRequest",
    subscriptionEnding: "subscriptionEnding",
    contactUs: 'contactUs',
    shortlistedByCompany: 'shortlistedByCompany',
    // generate random order id
    randomOrderId(length) {
        var result = "";
        var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    },
    // get cashback
    async calculateCashBack(amount, per) {
        return await ((amount * per) / 100);
    },
    generatePassword: password => {
        return new Promise((resolve, reject) => {
            return bcrypt.hash(password, 10, async(err, hash) => {
                if (err) reject();
                resolve(hash);
            });
        });
    },
    toUpperCase: str => {
        if (str.length > 0) {
            const newStr = str
                .toLowerCase()
                .replace(/_([a-z])/, m => m.toUpperCase())
                .replace(/_/, "");
            return str.charAt(0).toUpperCase() + newStr.slice(1);
        }
        return "";
    },
    generateReferrerCode: function(mobile) {
        let text = "";
        const possible = "0123456789";
        for (let i = 0; i < 3; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        const last5DigitFromMobile = mobile.substr(mobile.length - 5);
        return "HINDU" + last5DigitFromMobile + text;
    },
    createDynamicLink: async function(referralCode) {
        const { shortLink, previewLink } =
        await firebaseDynamicLinks.createLink({
            dynamicLinkInfo: {
                domainUriPrefix: process.env.domainUriPrefix,
                androidInfo: {
                    androidPackageName: process.env.androidPackageName,
                },
                link: process.env.dynamicUriPrefix + `?refer_code=${referralCode}`,
                iosInfo: {
                    iosBundleId: process.env.iosBundleId,
                },
            },

        });
        return shortLink;
    },
    /***
     * @description This function use for create validation unique key
     * @param apiTag
     * @param error
     * @returns {*}
     */
    validationMessageKey: (apiTag, error) => {
        let key = module.exports.toUpperCase(error.details[0].context.key);
        let type = error.details[0].type.split(".");
        type = module.exports.toUpperCase(type[1]);
        key = apiTag + " " + key + " " + type;
        return key;
    },
    /**
     * @description This function use for create random number
     * @param length
     * @returns {*}
     */
    makeRandomNumber: length => {
        let result = "";
        const characters = "0123456789";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    },
    generateMobileOtp: async function(len, mobile) {
        if (process.env.GENERATE_AND_SEND_OTP === "true") {
            let text = "";
            const possible = "0123456789";
            for (let i = 0; i < len; i++) {
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );
            }

            const mobileOtpExist = await User.findOne({
                where: {
                    mobile: mobile,
                    status: {
                        [Op.not]: Constants.DELETE,
                    },
                    otp: text,
                },
            }).then(mobileOtpExistData => mobileOtpExistData);

            if (mobileOtpExist) {
                await this.generateMobileOtp(len, mobile);
            }
            return text;
        } else {
            return 1234;
        }
    },
    generateReferrerCode: function(mobile) {
        let text = "";
        const possible = "0123456789";
        for (let i = 0; i < 3; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        const last5DigitFromMobile = mobile.substr(mobile.length - 5);
        return "HINDU" + last5DigitFromMobile + text;
    },

    generateReferrerCodeSocialLogin: function() {
        let text = "";
        const possible = "0123456789";
        for (let i = 0; i < 5; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        return "HINDU" + text;
    },
    generateResetToken: async function(len, mobile) {
        if (
            ["pre-production", "production"].indexOf(process.env.NODE_ENV) > -1
        ) {
            let text = "";
            const possible = "0123456789";
            for (let i = 0; i < len; i++) {
                text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );
            }

            const mobileResetTokenExist = await User.findOne({
                where: {
                    mobile: mobile,
                    status: {
                        [Op.not]: Constants.DELETE,
                    },
                    reset_token: text,
                },
            }).then(mobileResetTokenExistData => mobileResetTokenExistData);

            if (mobileResetTokenExist) {
                await this.generateResetToken(len, mobile);
            }
            return text;
        } else {
            return 1234;
        }
    },

    sendOtp: async function(mobile, otp) {
        if (process.env.GENERATE_AND_SEND_OTP === "true") {
            return new Promise(resolve => {
                fetch(
                        `${process.env.MSG91_SEND_OTP_URL}&mobile=91${mobile}&message=Your otp is ${otp}&otp=${otp}`
                    )
                    .then(res => res.json())
                    .then(() => {
                        resolve(true);
                    })
                    .catch(() => {
                        resolve(false);
                    });
            });
        } else {
            return true;
        }
    },

    ImageUpload: (req, res, imageName) => {
        console.log(":::imge :: ", imageName);
        console.log(":::imgepath :: ", req.files.image.path);
        const oldPath = req.files.image.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/images/user"
		)}/${imageName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(
                    res,
                    res.__("somethingWentWrong"),
                    500
                );
            }
        });
    },

    AdminServiceImageUpload: (req, res, imageName) => {
        console.log(req.path);
        const oldPath = req.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/images/user"
		)}/${imageName}`;
        const rawData = fs.readFileSync(oldPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(
                    res,
                    res.__("somethingWentWrong"),
                    500
                );
            }
        });
    },

    // use and run multiple times for the array of images
    ImageUploadMultiple: (image, res, imageName) => {
        console.log(imageName);
        console.log(image.path);
        const oldPath = image.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/images/user"
		)}/${imageName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(res, res.__('somethingWentWrong'), 500);
            }
        });
    },

    FileUpload: (req, res, fileName, folder = "certificate") => {
        const oldPath = req.files.file.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/" + folder
		)}/${fileName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log("path1");
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(
                    res,
                    res.__("somethingWentWrong"),
                    500
                );
            }
        });
    },

    FileUploader: (file, res, fileName, folder = "files") => {
        const oldPath = file.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/" + folder
		)}/${fileName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log("path1");
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(
                    res,
                    res.__("somethingWentWrong"),
                    500
                );
            }
        });
    },


    // removeImage, single image
    RemoveImage: (res, imageName) => {
        const ImagePath = `${path.join(
			__dirname,
			"../public/assets/images/user"
		)}/${imageName}`;
        // eslint-disable-next-line consistent-return
        fs.unlink(ImagePath, err => {
            if (err) {
                return;
                console.log("error on image remove :: ", err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },

    SepResumeUpload: (req, res, fileName) => {
        const oldPath = req.files.file.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/resume"
		)}/${fileName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },

    ResumeRemove: (res, resumeName) => {
        console.log('resume removed')
        const ImagePath = `${path.join(
			__dirname,
			"../public/assets/resume"
		)}/${resumeName}`;
        // eslint-disable-next-line consistent-return
        fs.unlink(ImagePath, err => {
            if (err) {
                console.log("error on resume remove :: ", err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },


    ResumeUpload: (req, res, resumeName) => {
        const oldPath = req.files.resume.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/resume"
		)}/${resumeName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log('369', err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },

    mediaUrl: (folder, name) => {
        if (name && name !== "") {
            return `/${folder}/${name}`;
        }
        return "";
    },

    pushNotification(notification, firebaseToken) {
        let message;
        if (Array.isArray(firebaseToken)) {
            message = {
                //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                registration_ids: firebaseToken,
                // collapse_key: 'your_collapse_key',

                notification: {
                    title: notification.title,
                },

                data: {
                    channelKey: "high_importance_channel",
                    body: notification.body
                }
            };

        } else {
            message = {
                //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: firebaseToken,
                // collapse_key: 'your_collapse_key',

                notification: {
                    title: notification.title,
                },

                data: {
                    channelKey: "high_importance_channel",
                    body: notification.body
                }
            };
        }

        if (message) {
            fcm.send(message, function(err, response) {
                if (err) {
                    console.log("Something has gone wrong!", err);
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }
    },

    pushNotificationToAll(notification, firebaseToken) {
        let message;
        if (Array.isArray(firebaseToken)) {
            message = {
                //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                registration_ids: firebaseToken,
                // collapse_key: 'your_collapse_key',

                notification: {
                    title: notification.title,
                },

                data: {
                    channelKey: "high_importance_channel",
                    body: notification.body
                }
            };

        } else {
            message = {
                //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: firebaseToken,
                // collapse_key: 'your_collapse_key',

                notification: {
                    title: notification.title,
                },

                data: {
                    channelKey: "high_importance_channel",
                    body: notification.body
                }
            };
        }

        if (message) {
            fcm.send(message, function(err, response) {
                if (err) {
                    console.log("Something has gone wrong!", err);
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }
    },

    // Counting work Experirence of a User
    workExperienceCount: (res, user_id) => {
        return new Promise(async function(resolve, reject) {
            let total = 0;
            if (user_id && user_id != "") {
                let userData = User.findByPk(user_id);
                if (userData && userData != "") {
                    await WorkExperience.findAll({
                        where: {
                            user_id,
                        },
                    }).then(async data => {

                        let workExperiences = [];

                        if (data && data != "") {
                            await data.forEach(async singleUser => {

                                var start = moment(singleUser.date_of_joining, "YYYY-MM-DD");
                                var end;
                                let notice_days;
                                if (singleUser.date_of_resigning && singleUser.date_of_resigning != "") {
                                    end = moment(singleUser.date_of_resigning, "YYYY-MM-DD");
                                } else {
                                    // here....
                                    // if(singleUser.notice_period &&  singleUser.notice_period != ''){
                                    // 	notice_days = await Math.abs((singleUser.updatedAt).diff(moment(), "days"))
                                    // 	end = moment(moment(), "YYYY-MM-DD");
                                    // }else{
                                    end = moment(moment(), "YYYY-MM-DD");
                                    // }
                                }
                                // here....
                                console.log("***************", Math.abs(start.diff(end, "months")) + 'months');

                                workExperiences.push(Math.abs(start.diff(end, "months")));

                            });

                            // console.log("workExperiences ", workExperiences);

                            total = await workExperiences.reduce(
                                (prev, current) => prev + current,
                                total
                            );
                            console.log("total ::: ", total);
                            resolve(total)

                        } else {
                            resolve(total);
                        }
                    });
                } else {
                    resolve(total);
                }
            } else {
                resolve(total);
            }
            resolve(total);
        });

    },

    //upload Video ( path => assets/videos )
    VideoUpload: (req, res, videoName) => {
        console.log(videoName);
        console.log(req.files.video.path);
        const oldPath = req.files.video.path;
        const newPath = `${path.join(
			__dirname,
			"../public/assets/videos"
		)}/${videoName}`;
        const rawData = fs.readFileSync(oldPath);
        console.log(newPath);
        // eslint-disable-next-line consistent-return
        fs.writeFile(newPath, rawData, err => {
            if (err) {
                console.log(err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },

    // remove video (path => assets/videos)
    RemoveVideo: (res, videoName) => {
        const VideoPath = `${path.join(
			__dirname,
			"../public/assets/videos"
		)}/${videoName}`;
        // eslint-disable-next-line consistent-return
        fs.unlink(VideoPath, err => {
            if (err) {
                console.log("error on video removal :: ", err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong"),
                    500
                );
            }
        });
    },

    calculateCommission: async(amount) => {
        return Math.floor((amount / 100) * 30)
    },


    cronMailer: async() => {
        let job = new CronJob('*/15 * * * *', async function() {

            // Task 1 - Chat Unread messages
            let arr = [{
                model: ChatChannel,
                attributes: [],
            }, ]

            let options = {
                where: {},
                attributes: {
                    include: [
                        [
                            Sequelize.literal(`(
                                SELECT  email
                                FROM user AS receivedUserDetails
                                WHERE
                                receivedUserDetails.id != Chat.user_id
                                AND 
                                receivedUserDetails.id IN (ChatChannel.sender_id,ChatChannel.receiver_id)
                            )`),
                            'realrecieverDetailsEmail'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT fcm_token
                                FROM user AS receivedUserDetails
                                WHERE
                                receivedUserDetails.id != Chat.user_id
                                AND 
                                receivedUserDetails.id IN (ChatChannel.sender_id,ChatChannel.receiver_id)
                            )`),
                            'realrecieverDetailsFcmtoken'
                        ],
                    ]
                },
                include: arr,
                raw: true
            }

            options['where'] = Sequelize.literal(`
				read_status = false AND
				TIMESTAMPDIFF(MINUTE, Chat.createdAt, NOW()) >  60 AND  TIMESTAMPDIFF(MINUTE, Chat.createdAt, NOW()) < 80
			`)

            let chatData = await Chat.findAll(options).catch(err => console.log(" :: err :: ", err))
            if (!(chatData.length > 0)) {
                console.log("no unread messages found");
            } else {

                let fcm1 = pluck(chatData, 'realrecieverDetailsFcmtoken');
                let email1 = pluck(chatData, 'realrecieverDetailsEmail');

                fcm1 = new Set(fcm1)
                email1 = new Set(email1)

                const locals = {
                    appName: module.exports.AppName,
                    title: 'MESSAGE RECEIVED',
                };

                let notification = {
                    title: "Message Received",
                    message: "You have received a message",
                };

                email1.length > 0 ? Mailer.sendMail(email1, 'Message Recieved!', module.exports.messageSent, locals) : console.log(":: No Emails Sent for Unread Messages ::");
                fcm1.length > 0 ? module.exports.pushNotification(notification, fcm1) : console.log(":: No Notifications Sent for Unread Messages ::");
            }

            // task 2 (notify HSP 1 days before their service request) - done
            let hspInclude = [

                {
                    model: service,
                    required: true,
                    include: [{
                        model: serviceRequest,
                        required: true,
                        where: {
                            service_provider_status: 'ACCEPTED',
                            user_status: 'REQUEST',
                        }
                    }]
                },

            ]

            // calcualting the time in minutes and setting a range for 24 hours
            hspInclude[0].include[0]['where'][Op.and] = Sequelize.literal(`TIMESTAMPDIFF(MINUTE,NOW(),request_date) > 1440 AND TIMESTAMPDIFF(MINUTE,NOW(),request_date) < 1455`);

            let foundUser = await User.findAndCountAll({
                where: {
                    user_role_type: 'HSP',
                },
                include: hspInclude,
                attributes: ["id", "fcm_token", "email"]
            })

            if (foundUser) {
                let userFcm = pluck(foundUser.rows, "fcm_token");
                let userEmail = pluck(foundUser.rows, "email");

                let notification = {
                    title: "Service Request",
                    message: 'Pending Service Request for tomorrow',
                };
                userFcm.length > 0 ? module.exports.pushNotification(notification, userFcm) : console.log("No Notifications Sent for Pending Service");

                const locals = {
                    appName: module.exports.AppName
                };
                userEmail.length > 0 ? Mailer.sendMail(userEmail, 'Pending Service Request', module.exports.pendingServiceRequest, locals) : console.log("No mails Sent for Pending Service");
            }

            // task 3 (notify Users 7 days before their subcription ends) - Pending           
            let subscriptionDetails = await User.findAll({
                where: {
                    status: ACTIVE
                },
                include: [{
                    model: SubscribedUser,
                    required: true,
                    where: {
                        status: ACTIVE,
                        literal: Sequelize.literal(`TIMESTAMPDIFF(MINUTE,NOW(),expiry_date) > 10080 AND TIMESTAMPDIFF(MINUTE,NOW(),expiry_date) < 10095`)
                    }
                }],
                attributes: ["email", "fcm_token"]
            })

            let fcm3 = pluck(subscriptionDetails, "fcm_token");
            let email3 = pluck(subscriptionDetails, "email");

            let notification3 = {
                title: "Subscription Ending",
                message: "One Of Subscription Plan is ending !!",
            };
            fcm3.length > 0 ? module.exports.pushNotification(notification3, fcm3) : console.log("No Notifications Sent for Subscription Ending");

            const locals3 = {
                appName: module.exports.AppName
            };
            email3.length > 0 ? Mailer.sendMail(email3, 'Subscription Ending', module.exports.subscriptionEnding, locals3) : console.log("No mails Sent for Subscription Ending");

            let data = `${new Date().toUTCString()} : unread message mails and Notifications delivered\n`;
            fs.appendFile("Maillogs.txt", data, function(err) {
                if (err) throw err;
                console.log("Status Logged!");
            });


        }, null, true, 'Asia/Kolkata');
        job.start();
    },

    calculateCommissionBc: async(amount) => {
        return (amount / 100) * COMMISSION_AMOUNT.bc;
    },

    calculateCommissionSubBc: async(amount) => {
        return (amount / 100) * COMMISSION_AMOUNT.sub_bc;
    },

    uniqueReferalCode: async(stateCode, roleType, id) => {
        return `${roleType}${stateCode}00${id}`;
    },
};