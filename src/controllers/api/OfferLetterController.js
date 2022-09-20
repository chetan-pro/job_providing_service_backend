const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Mailer = require('../../services/Mailer')
const Joi = require('@hapi/joi')
const moment = require('moment')
const path = require('path')
const {
    SUCCESS,
    FAIL,
    YES,
    NO,
    INTERNAL_SERVER,
    DELETE,
    PER_PAGE,
    USER_CERTIFICATE,
    IMAGESFOLDER,
    ACCEPT_OFFER,
    REJECT_OFFER,
    PENDING,
    ACTIVE,
    BAD_REQUEST,
    ACCEPT,
    REJECT,
    SHORTLISTED,
    SEND_OFFER,
    APPLY_JOB,
    OFFER_LETTER
} = require('../../services/Constants')
const { UserAppliedJob, User, Notification, JobPost, Industry, Sector, JobType, JobRoleType } = require('../../models')
const { assetsUrl } = require('../../../global');
module.exports = {
    AppliedJobList: async(req, res) => {
        const reqParams = req.params;
        // const {authUserId} = req
        await UserAppliedJob.findAndCountAll({
            include: {
                model: User,
                attributes: ["id", "name", "email"]
            },
            where: {
                job_post_id: reqParams.id,
                status: {
                    [Op.not]: DELETE,
                },
            }
        }).then(async(data) => {
            console.log("*********", data);
            if (data.rows.length > 0) {
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__('Success'),
                )
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }
        }, (e) => {
            console.log("*********e", e);
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },
    /**
     * @description 'Accept or Reject user job application '
     * @param req
     * @param res
     */
    AcceptRejectJobApplication: async(req, res) => {
        const requestParams = req.body

        const { authUserId, user_role_type, staff_id, companyId } = req

        const schema = Joi.object({
            company_status: Joi.string().valid(PENDING, SHORTLISTED, REJECT).required(),
            job_post_id: Joi.number().required(),
            user_id: Joi.number().required(),
            reason: Joi.string().when('company_status', { is: REJECT, then: Joi.required(), otherwise: Joi.optional() })
        });
        const { error } = await schema.validate(requestParams);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Applied jobs validation', error))
            )
        } else {
            await UserAppliedJob.findOne({
                where: {
                    user_id: requestParams.user_id,
                    job_post_id: requestParams.job_post_id,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(
                userData) => {
                if (userData) {
                    const userDetail = await User.findOne({
                        where: {
                            id: requestParams.user_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })
                    const CompanyDetail = await JobPost.findOne({
                        where: {
                            id: requestParams.job_post_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })

                    if (user_role_type === 'CS') {
                        userData.hired_staff_id = staff_id;
                        userData.save()
                    }
                    userData.company_status = requestParams.company_status
                    if (requestParams.reason) {
                        userData.reason = requestParams.reason
                    }

                    console.log("*********/", requestParams.reason);
                    userData.save().then(async(result) => {
                        if (result) {
                            console.log("******", result);
                            let locals = {
                                companyName: CompanyDetail.name,
                                username: userDetail.name,
                                appName: Helper.AppName,
                                jobTitle: CompanyDetail.job_title,
                            };
                            let notification = {
                                title: 'YOUR JOB APPLICATION!',
                                message: requestParams.company_status,
                                body: {
                                    userAppliedDetails: userData
                                },
                                notification_type: requestParams.company_status,
                                status: ACTIVE,
                                user_id: userDetail.id
                            }
                            if (requestParams.company_status === SHORTLISTED) {

                                locals = {
                                        username: userDetail.name,
                                        companyName: Helper.AppName,
                                    },
                                    notification = {
                                        title: 'Shortlisted For Job',
                                        message: userDetail.name + " You are Shortlisted For A job",
                                        body: {
                                            userAppliedDetails: userData
                                        },
                                        notification_type: requestParams.company_status,
                                        status: ACTIVE,
                                        user_id : userDetail.id
                                    }

                                if (userData.fcm_token != null || userData.fcm_token != '') {
                                    Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            try {
                                                Helper.pushNotification(notification, userDetail.fcm_token)
                                            } catch (error) {
                                                console.log("lack of stamina");
                                                console.log(error);
                                            }
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = Mailer.sendMail(userDetail.email, 'YOUR ARE SHORTLISTED', Helper.shortlistedByCompany, locals);
                                console.log("::::checking :::  ,", mail);

                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                            if (requestParams.company_status === REJECT) {

                                // rejected mail
                                locals = {
                                    username: userDetail.name,
                                    companyName: CompanyDetail.name,
                                    jobTitle: CompanyDetail.job_title
                                }

                                notification.title = 'Job Application Rejected'
                                notification.message = userDetail.name + ' Your job apllication has been rejected'

                                if (userData.fcm_token !== null || userData.fcm_token !== '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            try {
                                                Helper.pushNotification(notification, userDetail.fcm_token)
                                            } catch (error) {
                                                console.log("lack of stamina");
                                                console.log(error);
                                            }
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = await Mailer.sendMail(userDetail.email, 'Job Application Rejected', Helper.rejectByCompany, locals);
                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                            if (requestParams.company_status === PENDING) {
                                if (userData.fcm_token != null || userData.fcm_token != '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            try {
                                                Helper.pushNotification(notification, userDetail.fcm_token)
                                            } catch (error) {
                                                console.log("lack of stamina");
                                                console.log(error);
                                            }
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = await Mailer.sendMail(userDetail.email, 'YOUR JOB APPLICATION!', Helper.rejectApplyJobMail, locals);
                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch((e) => {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('User not found'),
                        SUCCESS
                    )
                }
            }).catch((e) => {
                console.log(e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },

    /**
     * @description 'Send offer letter'
     * @param req
     * @param res
     */
    SendOfferLetter: async(req, res) => {
        const requestParams = req.fields;
        const { authUserId } = req
        let file;
        const schema = Joi.object({
            job_post_id: Joi.number().required(),
            user_id: Joi.number().required(),
            file: Joi.string().optional(),
        })
        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Applied jobs validation', error))
            )
        } else {
            await UserAppliedJob.findOne({
                where: {
                    user_id: requestParams.user_id,
                    job_post_id: requestParams.job_post_id,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(userData) => {
                if (userData) {
                    if (req.files.file && req.files.file.size > 0) {
                        file = true;
                    }

                    console.log("::: req.files.file ::: ", req.files);

                    if (req.files.file && req.files.file.size < 0) {
                        return Response.errorResponseData(res, res.__('File invalid'), BAD_REQUEST);
                    }

                    const extension = req.files.file.type;
                    const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png', 'application/pdf'];
                    if (req.files.file && (!imageExtArr.includes(extension))) {
                        return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    }

                    const FileName = await file ? `${moment().unix()}${path.extname(req.files.file.name)}` : '';
                    const offerLetterUrl = `${process.env.assetsUrl}${IMAGESFOLDER.OFFERLETTER}\\${FileName}`;

                    console.log(":::: extension :::,", path.extname(req.files.file.name));


                    if (file) {
                        try {
                            Helper.FileUpload(req, res, FileName, IMAGESFOLDER.OFFERLETTER);
                            console.log("file uploded");
                        } catch (error) {
                            console.log("error :: :: ,", error);
                            console.log(" ::: : ::: offerLetterUrl :::: ", offerLetterUrl);
                            return Response.errorResponseWithoutData(
                                res,
                                res.locals.__('Internal server error'),
                                FAIL
                            )
                        }
                    }

                    const userDetail = await User.findOne({
                        where: {
                            id: requestParams.user_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })
                    const CompanyDetail = await User.findOne({
                        where: {
                            id: authUserId,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })
                    const obj = {
                            company_status: SEND_OFFER,
                            offer_letter: FileName,
                        }
                        //userData.company_status = requestParams.company_status
                    UserAppliedJob.update(obj, {
                        where: {
                            user_id: requestParams.user_id,
                            job_post_id: requestParams.job_post_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    }).then(async(result) => {
                        console.log("::::checking :::  ,1");

                        if (result) {

                            let jobDets = await JobPost.findOne({
                                where: {
                                    id: requestParams.job_post_id
                                },
                                include: [{
                                    model: JobRoleType
                                }, {
                                    model: Sector
                                }]
                            })

                            console.log("::::checking :::  ,2");
                            const locals = {
                                companyName: CompanyDetail.name,
                                username: userDetail.name,
                                role: jobDets.JobRoleType.name,
                                sector: jobDets.Sector.name,
                                title: jobDets.job_title,
                                offerLetterUrl: `${process.env.assetsUrl}${OFFER_LETTER}/${FileName}`
                            };

                            let notification = {
                                title: 'Offer Letter Received',
                                message: 'Congrats!!, You have an offerLetter',
                                body: {
                                    userAppliedDetails: result
                                },
                                notification_type: SEND_OFFER,
                                status: ACTIVE,
                                user_id: userDetail.id
                            }

                            if (userDetail.fcm_token !== null || userDetail.fcm_token !== '') {
                                await Notification.create(notification).then(async(result) => {
                                    if (result) {
                                        Helper.pushNotification(notification, userDetail.fcm_token)
                                    }
                                }).catch((e) => {
                                    console.log(e)
                                    return Response.errorResponseData(
                                        res,
                                        res.__('Internal error'),
                                        INTERNAL_SERVER
                                    )
                                })
                            }

                            // userDetail.email
                            const mail = await Mailer.sendMail(userDetail.email, 'OFFER LETTER!', Helper.sendOfferLetter, locals);

                            if (mail) {

                                return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                            } else {
                                Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                            }
                            console.log("::::checking :::  ,5", mail);

                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch((e) => {
                        console.log("::::2 error :::  ,", e);
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('User not found'),
                        SUCCESS
                    )
                }
            }).catch((e) => {
                console.log(":::: 1error ::: ,", e);
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },

    /**
     * @description 'Accept or Reject user job application '
     * @param req
     * @param res
     */
    AcceptRejectJobOfferLetter: async(req, res) => {
        const requestParams = req.body
        const { authUserId } = req

        console.log("authUserId :: , ", authUserId);

        const schema = Joi.object({
            candidate_status: Joi.string().valid(ACCEPT_OFFER, REJECT_OFFER).required(),
            job_post_id: Joi.number().required()
        })
        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Applied jobs validation', error))
            )
        } else {
            await UserAppliedJob.findOne({
                where: {
                    user_id: authUserId,
                    job_post_id: requestParams.job_post_id,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(userData) => {
                if (userData) {
                    const userDetail = await User.findOne({
                        where: {
                            id: authUserId,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    }).then(userDetail => userDetail);

                    const jobDetail = await JobPost.findByPk(requestParams.job_post_id);
                    const CompanyDetail = await User.findByPk(jobDetail.user_id);

                    userData.candidate_status = requestParams.candidate_status
                    userData.save().then(async(result) => {
                        if (result) {
                            const locals = {
                                companyName: CompanyDetail.name,
                                username: userDetail.name,
                                jobTitle: jobDetail.job_title
                            };
                            let notification = {
                                title: 'Accepted Offer Letter!',
                                message: userDetail.name + 'Accepted Offer Letter!',
                                body: {
                                    userAppliedDetails: userData
                                },
                                notification_type: requestParams.candidate_status,
                                status: ACTIVE,
                                user_id: CompanyDetail.id
                            }
                            if (requestParams.candidate_status === ACCEPT_OFFER) {
                                if (CompanyDetail.fcm_token !== null || CompanyDetail.fcm_token !== '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            Helper.pushNotification(notification, CompanyDetail.fcm_token)
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = Mailer.sendMail(CompanyDetail.email, userDetail.name + ' Accepted Offer Letter!', Helper.acceptOfferCandidate, locals);
                                const mailToJob = Mailer.sendMail(jobDetail.email, userDetail.name + ' Accepted Offer Letter!', Helper.acceptOfferCandidate, locals);
                                if (mail && mailToJob) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                            if (requestParams.candidate_status === REJECT_OFFER) {

                                const locals = {
                                    companyName: CompanyDetail.name,
                                    username: userDetail.name,

                                };
                                notification = {
                                    title: "Job Application Rejected",
                                    message: userDetail.name + ' Rejected Job Application',
                                    body: {
                                        userAppliedData: result
                                    },
                                    notification_type: APPLY_JOB,
                                    status: ACTIVE,
                                    user_id: userDetail.id
                                };

                                if (CompanyDetail.fcm_token !== null || CompanyDetail.fcm_token !== '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            Helper.pushNotification(notification, CompanyDetail.fcm_token)
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = await Mailer.sendMail(CompanyDetail.email, userDetail.name + ' Rejected Job Application', Helper.rejectJobOffferCandidate, locals);
                                const mailToJob = Mailer.sendMail(jobDetail.email, userDetail.name + ' Rejected Job Application', Helper.rejectJobOffferCandidate, locals);
                                if (mail && mailToJob) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch((e) => {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('User not found'),
                        SUCCESS
                    )
                }
            }).catch((e) => {
                console.log(e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },


    /**
     * @description 'Accept or Reject user job application '
     * @param req
     * @param res
     */
    RemoveOrRejectShortlistedCandidate: async(req, res) => {
        const requestParams = req.body
        const { authUserId } = req
        const schema = Joi.object({
            company_status: Joi.string().valid(PENDING, REJECT).required(),
            message: Joi.string().required(),
            job_post_id: Joi.number().required(),
            user_id: Joi.number().required(),
        })
        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Applied jobs validation', error))
            )
        } else {
            await UserAppliedJob.findOne({
                where: {
                    user_id: requestParams.user_id,
                    job_post_id: requestParams.job_post_id,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(userData) => {
                if (userData) {
                    const userDetail = await User.findOne({
                        where: {
                            id: requestParams.user_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })
                    const CompanyDetail = await User.findOne({
                        where: {
                            id: requestParams.user_id,
                            status: {
                                [Op.not]: DELETE
                            }
                        }
                    })
                    userData.company_status = requestParams.company_status
                    userData.save().then(async(result) => {
                        if (result) {
                            const locals = {
                                companyName: CompanyDetail.name,
                                username: userDetail.name,
                                appName: Helper.AppName,
                                jobTitle: CompanyDetail.job_title
                            };
                            let notification = {
                                title: 'YOUR JOB APPLICATION!',
                                message: requestParams.message,
                                body: {
                                    userAppliedDetails: userData
                                },
                                notification_type: requestParams.company_status,
                                status: ACTIVE,
                                user_id: userData.id
                            }
                            if (requestParams.company_status === PENDING) {
                                if (userData.fcm_token !== null || userData.fcm_token !== '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            Helper.pushNotification(notification, userData.fcm_token)
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = await Mailer.sendMail(userDetail.email, 'YOUR JOB APPLICATION!', Helper.acceptApplyJobMail, locals);
                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                            if (requestParams.company_status === REJECT) {
                                if (userData.fcm_token !== null || userData.fcm_token !== '') {
                                    await Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            Helper.pushNotification(notification, userData.fcm_token)
                                        }
                                    }).catch((e) => {
                                        console.log(e)
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    })
                                }
                                const mail = await Mailer.sendMail(userDetail.email, 'YOUR JOB APPLICATION!', Helper.rejectApplyJobMail, locals);
                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Your response send successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            }
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch((e) => {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('User not found'),
                        SUCCESS
                    )
                }
            }).catch((e) => {
                console.log(e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },

}