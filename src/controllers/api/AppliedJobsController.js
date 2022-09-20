const { Op, where } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Mailer = require("../../services/Mailer");
const moment = require("moment");
const path = require("path");
const Joi = require("@hapi/joi");
var pluck = require("arr-pluck");
const { sequelize } = require("sequelize");
const {
    SUCCESS,
    FAIL,
    YES,
    NO,
    USER_RESUME,
    INTERNAL_SERVER,
    DELETE,
    PER_PAGE,
    MONTH,
    DAYS,
    MONTHLY,
    ANNUAL,
    IMAGESFOLDER,
    ACTIVE,
    BAD_REQUEST,
    APPLY_JOB,
    PENDING,
    SHORTLISTED,
    SEND_OFFER,
    ACCEPT_OFFER,
    REJECT_OFFER,
    ACCEPT,
    REJECT,
    CLOSE,
    INACTIVE,
    OPEN,
    OFFER_LETTER,
    USER_ROLE_TYPE
} = require("../../services/Constants");
const { assetsUrl } = require("../../../global");
const {
    UserAppliedJob,
    User,
    Industry,
    Notification,
    UserLikedJobs,
    JobRoleType,
    Sector,
    JobType,
    Question,
    city,
    state,
    SkillSubCategory,
    JobPostSkill,
    EducationData,
    JobPost,
    UserSkill,
    WorkExperience,
    Education,
    NotInterested,
    SubscribedUser,
    ResumeAccessData,
    UserRoles
} = require("../../models");
const { workExperienceCount } = require("../../services/Helper");
const { sendMail } = require("../../services/Mailer");

module.exports = {

    UserAppliedJobsList: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req;
        let limit = null;
        let query;
        let promise = [];

        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1;
        const offset = (pageNo - 1) * limit;
        if (requestParams.filter_by_company_status && requestParams.filter_by_company_status !== "") {
            let filter_by_company_status =
                requestParams.filter_by_company_status.split(",");
            query = {
                ...query,
                company_status: {
                    [Op.in]: filter_by_company_status,
                },
            };
        }

        if (requestParams.filter_by_candidate_status && requestParams.filter_by_candidate_status !== "") {
            let filter_by_candidate_status = requestParams.filter_by_candidate_status.split(",");
            query = {
                ...query,
                candidate_status: {
                    [Op.in]: filter_by_candidate_status,
                },
            };
        }

        let sorting = [
            [
                "id",
                requestParams.sortBy != null ? requestParams.sortBy : "DESC",
            ],
        ];
        let arr = [{
                model: Industry,
                attributes: ["id", "name"],
            },
            {
                model: Sector,
                attributes: ["id", "name"],
            },
            {
                model: JobType,
                attributes: ["id", "name"],
            },
            {
                model: city,
                attributes: ["id", "name"],
            },
            {
                model: state,
                attributes: ["id", "name"],
            },
            {
                model: JobRoleType,
                attributes: ["id", "name"],
            },
            {
                model: UserLikedJobs,
                where: { user_id: authUserId },
                required: false,
            },
            {
                model: UserAppliedJob,
                where: { user_id: authUserId },
                required: false,
            },
            {
                model: EducationData,
                attributes: ["id", "name"],
            },
            {
                model: Question,
                attributes: ["id", "questions"],
            },
            {
                model: User,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            },
            {
                model: JobPostSkill,
                attributes: ["skill_sub_category_id"],
                include: {
                    model: SkillSubCategory,
                    attributes: ["id", "name", "skill_category_id"],
                },
            },
        ];
        query = {
            ...query,
            user_id: authUserId,
            status: {
                [Op.not]: DELETE,
            },
        };
        const options = {
            include: {
                model: JobPost,
                include: arr,
                where: {
                    [Op.and]: {
                        status: {
                            [Op.eq]: ACTIVE
                        },
                        job_status: {
                            [Op.eq]: OPEN
                        }
                    }
                }
            },
            where: query,
            order: sorting,
            offset: offset,
        };
        if (limit) options["limit"] = limit;
        await UserAppliedJob.findAndCountAll(options).then(
            async data => {
                if (data.rows.length > 0) {
                    await data.rows.forEach(function(result) {
                        promise.push(
                            new Promise(async(resolve, reject) => {
                                result.separate_resume = Helper.mediaUrl(
                                    USER_RESUME,
                                    result.separate_resume
                                );
                                if (result['offer_letter'] && result['offer_letter'] != '') {
                                    result['offer_letter'] = `/${OFFER_LETTER}/${result['offer_letter']}`
                                }
                                resolve(true);
                            })
                        );
                    });
                    Promise.all(promise).then(async() => {
                        const extra = [];
                        extra.per_page = limit;
                        extra.total = data.count;
                        extra.page = pageNo;
                        // extra.imageBaseUrl =
                        // 	assetsUrl + IMAGESFOLDER.OFFERLETTER + "/";

                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("success"),
                            extra
                        );
                    });
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No Data Found"),
                        FAIL
                    );
                }
            },
            e => {
                console.log(e);
                Response.errorResponseData(
                    res,
                    res.__("Internal Error"),
                    INTERNAL_SERVER
                );
            }
        );
    },

    /**
     * @description 'This function is use to add  applied job'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    UserAddAppliedJob: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req;


        console.log(":::: authUserId ::: ,", authUserId);

        let file;
        const requestObj = {
            id: Joi.number().required(),
            file: Joi.string().optional(),
        };
        const schema = Joi.object(requestObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey("Edit profile validation", error)
                )
            );
        } else {
            await UserAppliedJob.findOne({
                    where: {
                        job_post_id: reqParam.id,
                        user_id: authUserId,
                    },
                })
                .then(async data => {
                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__("Already applied in job"),
                            FAIL
                        );
                    } else {

                        console.log(" :: req.files , ", req.files.file);


                        if (req.files.file && req.files.file.size > 0) {
                            file = true;
                        }
                        if (req.files.file && req.files.file.size < 0) {
                            return Response.errorResponseData(
                                res,
                                res.__("File invalid"),
                                BAD_REQUEST
                            );
                        }
                        console.log(file);
                        const FileName = file ?
                            `${moment().unix()}${path.extname(
									req.files.file.name
							  )}` :
                            "";

                        const WorkExpObj = {
                            job_post_id: reqParam.id,
                            user_id: authUserId,
                            status: ACTIVE,
                            separate_resume: FileName,
                            company_status: PENDING,
                            candidate_status: APPLY_JOB,
                        };
                        await UserAppliedJob.create(WorkExpObj)
                            .then(async result => {
                                if (result) {
                                    let mail;
                                    const userDetail = await User.findByPk(
                                        authUserId
                                    );
                                    console.log(
                                        "---------------------------",
                                        userDetail
                                    );
                                    const jobDetail = await JobPost.findOne({
                                            where: {
                                                id: reqParam.id,
                                            },
                                            include: [{
                                                    model: city
                                                },
                                                {
                                                    model: state
                                                }
                                            ]
                                        }

                                    );
                                    console.log(
                                        "###############################", jobDetail
                                    );

                                    if (!jobDetail) {
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Job details not found"),
                                            FAIL
                                        );
                                    }


                                    const CompanyDetail = await User.findByPk(jobDetail.user_id);

                                    if (!CompanyDetail) {
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Company details not found"),
                                            FAIL
                                        );
                                    }

                                    console.log(" :: jobDetail.user_id :: ", jobDetail.user_id);
                                    console.log(" :: jobDetail.user_id :: ", CompanyDetail);


                                    //console.log(CompanyDetail)
                                    if (file) {
                                        Helper.SepResumeUpload(
                                            req,
                                            res,
                                            FileName
                                        );
                                    }
                                    console.log("jobDetails ::: :, ", jobDetail);
                                    const locals = {
                                        companyName: CompanyDetail.name,
                                        username: userDetail.name,
                                        appName: Helper.AppName,
                                        jobTitle: jobDetail.job_title,
                                        city: jobDetail.city.name,
                                        state: jobDetail.state.name,
                                    };
                                    let notification = {
                                        title: "USER APPLY JOB!",
                                        message: APPLY_JOB,
                                        body: {
                                            userAppliedData: result
                                        },
                                        notification_type: APPLY_JOB,
                                        status: ACTIVE,
                                        user_id: CompanyDetail.id
                                    };

                                    // company notification
                                    if (CompanyDetail.fcm_token !== null || CompanyDetail.fcm_token !== "") {
                                        await Notification.create(notification)
                                            .then(async result => {
                                                // find All staff members of the company
                                                // staff notifications  and mail 
                                                User.findAll({
                                                    where: {
                                                        user_role_type: 'CS',
                                                        company_id: jobDetail.user_id
                                                    }
                                                }).then(async data => {

                                                    // mail and notification to company and staff
                                                    let staff_token = pluck(data, 'fcm_token').filter(fcm => fcm != null);
                                                    let staff_email = pluck(data, 'email').filter(mail => mail != null);
                                                    staff_token.push(CompanyDetail.fcm_token)
                                                    staff_email.push(CompanyDetail.email)

                                                    mail = Mailer.sendMail(staff_email, "USER APPLY JOB ", Helper.acceptApplyJobMail, locals)
                                                    Mailer.sendMail(jobDetail.email, "USER APPLY JOB ", Helper.acceptApplyJobMail, locals)
                                                    Helper.pushNotification(notification, staff_token)

                                                    // mail and notification to the one who applied
                                                    Mailer.sendMail(userDetail.email, "USER APPLY JOB ", Helper.applyJobCandidate, locals)
                                                    Helper.pushNotification(notification, userDetail.fcm_token)

                                                })

                                            })
                                            .catch(e => {
                                                console.log(e);
                                                return Response.errorResponseData(
                                                    res,
                                                    res.__("internal Error"),
                                                    INTERNAL_SERVER
                                                );
                                            });
                                    }

                                    if (CompanyDetail != '') {
                                        return Response.successResponseData(
                                            res,
                                            result,
                                            SUCCESS,
                                            'User applied Successfully',
                                        )
                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.locals.__("global Error"),
                                            INTERNAL_SERVER
                                        );
                                    }

                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__("internal Error"),
                                        INTERNAL_SERVER
                                    );

                                }
                            })
                            .catch(async e => {
                                console.log(e);
                                Response.errorResponseData(
                                    res,
                                    res.__("internal Error"),
                                    INTERNAL_SERVER
                                );
                            });
                    }
                })
                .catch(async e => {
                    console.log(e);
                    Response.errorResponseData(
                        res,
                        res.__("internal Error"),
                        INTERNAL_SERVER
                    );
                });
        }
    },

    CompanySelect: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req;

        console.log(":::: authUserId ::: ,", authUserId);

        const requestObj = {
            user_id: Joi.string().required(),
            job_post_id: Joi.string().optional(),
        };
        const schema = Joi.object(requestObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey("Edit profile validation", error)
                )
            );
        } else {
            await UserAppliedJob.findOne({
                    where: {
                        job_post_id: reqParam.job_post_id,
                        user_id: reqParam.user_id,
                    },
                })
                .then(async data => {
                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__("Already applied in job")
                        );
                    } else {
                        const WorkExpObj = {
                            job_post_id: reqParam.job_post_id,
                            user_id: reqParam.user_id,
                            status: ACTIVE,
                            company_status: SEND_OFFER,
                            candidate_status: APPLY_JOB,
                            // check once
                            offer_letter: req.files.offer_letter,
                            is_company_selected: true
                        };
                        await UserAppliedJob.create(WorkExpObj)
                            .then(async result => {
                                if (result) {
                                    let mail;
                                    const userDetail = await User.findByPk(
                                        authUserId
                                    );

                                    const jobDetail = await JobPost.findOne({
                                            where: {
                                                id: reqParam.job_post_id,
                                            },
                                            include: [{
                                                    model: city
                                                },
                                                {
                                                    model: state
                                                }
                                            ]
                                        }

                                    );
                                    console.log(
                                        "###############################",
                                        jobDetail
                                    );
                                    const CompanyDetail = await User.findByPk(
                                        jobDetail.user_id
                                    );
                                    //console.log(CompanyDetail)
                                    console.log("jobDetails ::: :, ", jobDetail);
                                    const locals = {
                                        companyName: CompanyDetail.name,
                                        username: userDetail.name,
                                        appName: Helper.AppName,
                                        jobTitle: jobDetail.job_title,
                                        city: jobDetail.city.name,
                                        state: jobDetail.state.name,
                                    };
                                    let notification = {
                                        title: "USER APPLY JOB!",
                                        message: APPLY_JOB,
                                        body: {
                                            userAppliedData: result
                                        },
                                        notification_type: APPLY_JOB,
                                        status: ACTIVE,
                                        user_id: CompanyDetail.id
                                    };

                                    // company notification
                                    if (CompanyDetail.fcm_token !== null || CompanyDetail.fcm_token !== "") {
                                        await Notification.create(notification)
                                            .then(async result => {
                                                // find All staff members of the company
                                                // staff notifications  and mail 
                                                User.findAll({
                                                    where: {
                                                        user_role_type: 'CS',
                                                        company_id: jobDetail.user_id
                                                    }
                                                }).then(async data => {

                                                    // mail and notification to company and staff
                                                    let staff_token = pluck(data, 'fcm_token').filter(fcm => fcm != null);
                                                    let staff_email = pluck(data, 'email').filter(mail => mail != null);
                                                    staff_token.push(CompanyDetail.fcm_token)
                                                    staff_email.push(CompanyDetail.email)

                                                    mail = Mailer.sendMail(staff_email, "USER APPLY JOB ", Helper.acceptApplyJobMail, locals)
                                                    Helper.pushNotification(notification, staff_token)

                                                    // mail and notification to the one who applied
                                                    Mailer.sendMail(userDetail.email, "USER APPLY JOB ", Helper.applyJobCandidate, locals)
                                                    Helper.pushNotification(notification, userDetail.fcm_token)

                                                })

                                            })
                                            .catch(e => {
                                                console.log(e);
                                                return Response.errorResponseData(
                                                    res,
                                                    res.__("internal Error"),
                                                    INTERNAL_SERVER
                                                );
                                            });
                                    }

                                    if (CompanyDetail != '') {
                                        return Response.successResponseData(
                                            res,
                                            result,
                                            SUCCESS,
                                            'User applied Successfully',
                                        )
                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.locals.__("global Error"),
                                            INTERNAL_SERVER
                                        );
                                    }

                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__("internal Error"),
                                        INTERNAL_SERVER
                                    );

                                }
                            })
                            .catch(async e => {
                                console.log(e);
                                Response.errorResponseData(
                                    res,
                                    res.__("internal Error"),
                                    INTERNAL_SERVER
                                );
                            });
                    }
                })
                .catch(async e => {
                    console.log(e);
                    Response.errorResponseData(
                        res,
                        res.__("internal Error"),
                        INTERNAL_SERVER
                    );
                });
        }

    },


    AppliedJobsList: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req;
        let promise = [];
        let limit = null;
        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1;

        const offset = (pageNo - 1) * limit;

        let sorting = [
            ["updatedAt", "DESC"]
        ];

        let arr = [{
                model: Industry,
                attributes: ["id", "name"],
            },
            {
                model: Sector,
                attributes: ["id", "name"],
            },
            {
                model: JobType,
                attributes: ["id", "name"],
            },
            {
                model: UserLikedJobs,
            },
            {
                model: city,
                attributes: ["id", "name"],
            },
            {
                model: state,
                attributes: ["id", "name"],
            },
            {
                model: EducationData,
                attributes: ["id", "name"],
            },
            {
                model: Question,
                attributes: ["id", "questions"],
            },

            {
                model: JobPostSkill,
                attributes: ["skill_sub_category_id"],
                include: {
                    model: SkillSubCategory,
                    attributes: ["id", "name", "skill_category_id"],
                },
            },
        ];
        const jobs = await JobPost.findAll({
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            },
        });
        const companyJobIds = await jobs.map(i => i.job_post_id);
        const options = {
            include: {
                model: JobPost,
                include: arr,
            },
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            },
            order: sorting,
            offset: offset,
        };
        if (limit) options["limit"] = limit;
        await UserAppliedJob.findAndCountAll(options).then(
            async data => {
                if (data.rows.length > 0) {
                    await data.rows.forEach(function(result) {
                        promise.push(
                            new Promise(async(resolve, reject) => {
                                result.separate_resume = Helper.mediaUrl(
                                    USER_RESUME,
                                    result.separate_resume
                                );
                                resolve(true);
                            })
                        );
                    });
                    Promise.all(promise).then(async() => {
                        const extra = [];
                        extra.per_page = limit;
                        extra.total = data.count;
                        extra.page = pageNo;
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("success"),
                            extra
                        );
                    });
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("no Data Found"),
                        FAIL
                    );
                }
            },
            e => {
                console.log(e);
                Response.errorResponseData(
                    res,
                    res.__("internal Error"),
                    INTERNAL_SERVER
                );
            }
        );
    },

    ShortListedJobsList: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req;
        let limit = null;
        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1;
        const offset = (pageNo - 1) * limit;
        let sorting = [
            ["updatedAt", "DESC"]
        ];
        let arr = [{
                model: Industry,
                attributes: ["id", "name"],
            },
            {
                model: Sector,
                attributes: ["id", "name"],
            },
            {
                model: JobType,
                attributes: ["id", "name"],
            },
            {
                model: city,
                attributes: ["id", "name"],
            },
            {
                model: state,
                attributes: ["id", "name"],
            },
            {
                model: EducationData,
                attributes: ["id", "name"],
            },
            {
                model: Question,
                attributes: ["id", "questions"],
            },
            {
                model: User,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            },
            {
                model: JobPostSkill,
                attributes: ["skill_sub_category_id"],
                include: {
                    model: SkillSubCategory,
                    attributes: ["id", "name", "skill_category_id"],
                },
            },
        ];
        const jobs = await JobPost.findAll({
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            },
        });
        const companyJobIds = await jobs.map(i => i.job_post_id);
        const options = {
            include: {
                model: JobPost,
                include: arr,
            },
            where: {
                user_id: authUserId,
                company_status: SHORTLISTED,
                status: {
                    [Op.not]: DELETE,
                },
            },
            order: sorting,
            offset: offset,
        };
        if (limit) options["limit"] = limit;
        await UserAppliedJob.findAndCountAll(options).then(
            data => {
                if (data.rows.length > 0) {
                    const extra = [];
                    extra.per_page = limit;
                    extra.total = data.count;
                    extra.page = pageNo;
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("success"),
                        extra
                    );
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("no Data Found"),
                        FAIL
                    );
                }
            },
            e => {
                console.log(e);
                Response.errorResponseData(
                    res,
                    res.__("Internal Error"),
                    INTERNAL_SERVER
                );
            }
        );
    },

    getAppliedJobById: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req;
        let limit = null;
        let query;
        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1;
        const offset = (pageNo - 1) * limit;
        if (
            requestParams.filter_by_company_status &&
            requestParams.filter_by_company_status !== ""
        ) {
            let filter_by_company_status =
                requestParams.filter_by_company_status.split(",");
            query = {
                ...query,
                company_status: {
                    [Op.in]: filter_by_company_status,
                },
            };
        }
        if (
            requestParams.filter_by_candidate_status &&
            requestParams.filter_by_candidate_status !== ""
        ) {
            let filter_by_candidate_status =
                requestParams.filter_by_candidate_status.split(",");
            query = {
                ...query,
                candidate_status: {
                    [Op.in]: filter_by_candidate_status,
                },
            };
        }
        let sorting = [
            ["updatedAt", "DESC"]
        ];
        let arr = [{
                model: User,
                attributes: ["id", "name", "email"],
                include: [{
                    model: WorkExperience
                }]
            },
            // ,{
            //     model: Industry,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: Sector,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: JobType,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: city,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: state,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: EducationData,
            //     attributes: ['id', 'name']
            // },
            // {
            //     model: Question,
            //     attributes: ['id', 'questions'],
            // },

            // {
            //     model: JobPostSkill,
            //     attributes: ['skill_sub_category_id'],
            //     include: {
            //         model: SkillSubCategory,
            //         attributes: ['id', 'name', 'skill_category_id'],
            //     }
            // }
        ];
        query = {
            ...query,
            job_post_id: requestParams.job_post_id,
            status: {
                [Op.not]: DELETE,
            },
        };
        const options = {
            include: arr,
            where: query,
            order: sorting,
            offset: offset,
        };



        if (limit) options["limit"] = limit;
        await UserAppliedJob.findAndCountAll(options).then(
            async data => {

                for (let i = 0; i < data.rows.length; i++) {
                    data.rows[i].User.dataValues["workExperienceCount"] = await Helper.workExperienceCount(res, data.rows[i].User.id);

                    data.rows[i].User.WorkExperiences.map(singleWorkExperience => {
                        if (singleWorkExperience.currently_employed === 'Y') {
                            data.rows[i].User.dataValues['currently_employed'] = 'Y';
                            data.rows[i].User.dataValues['hired_date'] = singleWorkExperience.date_of_joining;
                            data.rows[i].User.dataValues['notice_period_days'] = singleWorkExperience.notice_period_days;
                        }
                    })
                }

                if (data.rows.length > 0) {
                    const extra = [];
                    extra.per_page = limit;
                    extra.total = data.count;
                    extra.page = pageNo;
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Success"),
                        extra
                    );
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No data found"),
                        FAIL
                    );
                }
            },
            e => {
                console.log(e);
                Response.errorResponseData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                );
            }
        );
    },


    getUserApplied: async(req, res) => {
        const {
            page,
            sortBy,
            skill,
            salary_range,
            cities,
            education,
            mobile_no,
            email,
            name,
            application_status,
            work_experience_range,
            candidate,
            state_id,
            industry_id,
            pin_code
        } = req.query;

        const { authUserId } = req;


        let subscriptionDetails = await SubscribedUser.findOne({
            where: {
                user_id: authUserId,
                status: ACTIVE,
                email_limit: {
                    [Op.gt]: 0
                },
                cv_limit: {
                    [Op.gt]: 0
                }
            }
        })

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        let offsetData = (pageNo - 1) * limit;

        let sorting = [
            ["id", sortBy != null ? sortBy : "ASC"]
        ];


        console.log(" :: ::: :: authUserId : ", authUserId);
        // all jobs of a company
        let jobPostCompany = await JobPost.findAll({
            where: {
                user_id: authUserId,
            }
        })

        console.log("company job post ::: ", jobPostCompany);

        let plucked = pluck(jobPostCompany, 'id');

        let arr = [{
                model: WorkExperience,
                attributes: ["id", "user_id", "currently_employed", 'current_salary', "industry_id"],
                required: false,
                where: {},
            },
            {
                model: UserSkill,
                attributes: ["id", "user_id", "skill_sub_category_id"],
                required: false,
                include: [{
                    model: SkillSubCategory,
                    required: false,
                }],
                where: {},
            },
            {
                model: Education,
                attributes: ["id", "education_id", "institute_name"],
                required: false,
                where: {},
            },
            {
                model: city,
                where: {}
            },
            {
                model: state,
                where: {}
            },
            {
                model: UserAppliedJob,
                attributes: ["id", "user_id", "company_status", "candidate_status", "job_post_id", "reason", "updatedAt"],
                where: {
                    job_post_id: {
                        [Op.in]: plucked
                    }
                },
                include: [{
                    model: JobPost,
                    where: {
                        status: {
                            [Op.not]: DELETE
                        },
                        job_status: {
                            [Op.not]: CLOSE
                        },
                    },
                    attributes: ["id", "name", "status", "user_id", "job_status", "job_title", "updatedAt", "industry_id"],
                }],
            },
            {
                model: UserRoles,
                where: {
                    roleType: USER_ROLE_TYPE.candidate
                },
                attributes: []
                    // required : true
            }
        ]



        let options = {
            where: {},
            include: arr,
        };

        if (!candidate) {
            options["subQuery"] = false;
            options["order"] = sorting;
            options["offset"] = offsetData;
            if (limit) options["limit"] = limit
        }


        // where User
        if (name)
            options["where"]["name"] = {
                [Op.or]: [{
                    [Op.like]: "%" + name + "%"
                }],
            };

        if (email)
            options["where"]["email"] = {
                [Op.or]: [{
                    [Op.like]: "%" + email + "%"
                }],
            };

        if (pin_code) options["where"]["pin_code"] = {
            [Op.or]: [{
                [Op.like]: "%" + pin_code + "%"
            }]
        }

        if (mobile_no)
            options["where"]["mobile"] = {
                [Op.or]: [{
                    [Op.like]: "%" + mobile_no + "%"
                }],
            };

        if (salary_range)
            arr[0]["where"]["current_salary"] = {
                [Op.between]: salary_range,
            };

        if (skill) {
            let skillData = skill.split(',');
            // arr[2]["required"] = true;
            arr[1]['where']['skill_sub_category_id'] = {
                [Op.in]: skillData,
            };
        }

        if (education) {
            let educationData = education.split(',');
            options["include"][2]["required"] = true;
            options["include"][2]["where"]["education_id"] = {
                [Op.in]: educationData,
            };
        }

        if (cities) {
            let citiesData = cities.split(',');
            arr[3]["where"]["id"] = {
                [Op.in]: [citiesData]
            }
        }

        if (state_id) {
            let stateData = state_id.split(',');
            arr[4]["where"]["id"] = {
                [Op.in]: [stateData]
            }

        };

        if (cities && state_id) {
            let citiesData = cities.split(',');
            let stateData = state_id.split(',');
            arr[4]["where"] = {};
            arr[3]["where"] = {};
            options.where[Op.or] = {
                "state_id": {
                    [Op.or]: [stateData]
                },
                "city_id": {
                    [Op.or]: [citiesData]
                }
            }
        }


        console.log("authUserId :::", authUserId);


        if (application_status) {
            // let applicationData = application_status.split(',')
            if (!plucked.length > 0) {
                arr[5]["where"]['job_post_id'] = null;
                console.log("in the if :::");
            } else {
                arr[5]["where"] = {
                    job_post_id: {
                        [Op.in]: plucked
                    },
                    [Op.or]: {
                        company_status: application_status,
                        candidate_status: application_status,
                    },
                }
            };
        }
        console.log("::::::::::::::::::::::::::::here plucked :: ", plucked);
        // return res.send({ ar: arr[5] })

        console.log("::::::::::::::::::::::::::::here whereeeee :: ", arr[5]["where"]);


        if (industry_id) {
            arr[0]["required"] = true
            arr[0]["where"][Op.and] = {
                industry_id: {
                    [Op.eq]: industry_id
                }
            }
        }

        if (!subscriptionDetails) {
            options.attributes = ["id", "name", "image"]
        }

        let applyDetails = await User.findAndCountAll(options);

        if (limit) options["limit"] = limit

        console.log(" :: logged  :: options ", options);

        if (candidate) {
            let Applied = pluck(applyDetails.rows, 'id');

            arr.forEach(data => data['required'] = false)
            if (industry_id) {
                console.log("::: industry id ::", industry_id);
                arr[0]["required"] = true
            }

            options["order"] = sorting;
            options["offset"] = offsetData;
            if (limit) options["limit"] = limit


            arr[1]['include'][0]['required'] = false
            arr[5]['include'][0]['required'] = false

            if (education) {
                let educationData = education.split(',');
                options["include"][2]["required"] = true;
                options["include"][2]["where"]["education_id"] = {
                    [Op.in]: educationData,
                };
            }

            console.log(" :: Applied ,", Applied);


            if (!subscriptionDetails) {
                options.attributes = ["id", "name", "image"];
            }

            options['where']['id'] = {
                    [Op.notIn]: Applied
                }
                // options['where']['id'] = {[Op.notIn] :  Applied}
            arr[6]["required"] = true;

            let notApplyDetails = await User.findAndCountAll(options)
            applyDetails = notApplyDetails;

            console.log("notApplyDetails ::: , ", notApplyDetails.rows.length);
            console.log(":::: data ::: ", options.where);
        }



        // let count = 0;
        // applyDetails.rows.map(async (singleDetail,index) =>{
        // 	console.log(" :: index : :",index);
        // 	applyDetails['rows'][index].dataValues['Experience'] = await Helper.workExperienceCount(res,singleDetail.id) +  " months";	
        // 	console.log(" :: index :: => ");
        // })

        // let workExperienced;
        // async function ExecuteFunction(){
        // 	await applyDetails.rows.forEach( (data,index) =>{
        // 		Helper.workExperienceCount(res,data.id)
        // 		.then( async experience => {
        // 			console.log(":: experience :: ", experience);
        // 			return applyDetails.rows[index].dataValues['Experience'] = experience + ' months';
        // 		})
        // 	})
        // 	workExperienced = await applyDetails;
        // }
        // await ExecuteFunction();
        // console.log(" :: applyDetails :: ", workExperienced);



        if (!(applyDetails && applyDetails != "" && applyDetails.rows.length > 0)) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No applicant found"),
                FAIL
            );
        } else {
            return Response.successResponseData(
                res,
                applyDetails,
                SUCCESS,
                res.locals.__("success")
            );
        }
    },

    notInterestedjobList: async(req, res) => {

        const { page, sortBy, job_id } = req.query;
        const { authUserId } = req;

        console.log(" authUserId :::", authUserId);

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        let arr = [{
            model: JobPost,
            include: [{
                model: User,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            }, ]
        }]

        let options = {
            where: {
                user_id: authUserId,
                status: ACTIVE
            },
            order: sorting,
            offset: offset,
            include: arr
        }

        if (limit) options['limit'] = limit;
        if (job_id && job_id != '') {

            options['where']['id'] = job_id;

            await NotInterested.findOne(options)
                .then(async data => {
                    if (data) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        Response.errorResponseData(
                            res,
                            res.__("No not-interested jobs found"),
                            INTERNAL_SERVER
                        );
                    }
                })
                .catch((e) => {
                    console.log("error ::", e);
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No not-interested jobs found"),
                        FAIL
                    );
                })

        } else {
            await NotInterested
                .findAndCountAll(options)
                .then(
                    async data => {
                        if (data.rows.length > 0) {
                            return Response.successResponseData(
                                res,
                                data,
                                SUCCESS,
                                res.locals.__("Success")
                            );
                        } else {
                            return Response.errorResponseWithoutData(
                                res,
                                res.locals.__("No not-interested found"),
                                FAIL
                            );
                        }
                    },
                    err => {
                        console.log(err);
                        Response.errorResponseData(
                            res,
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                );
        }
    },

    addResumeAccessDetails: async(req, res) => {
        const { authUserId } = req;
        const reqParam = req.body;


        var reqObj = {
            email_downloaded: Joi.string(),
            cv_downloaded: Joi.string(),
            user_subscribed_id: Joi.number().required(),
            info_accessed_user_id: Joi.number().required()
        }

        const schema = Joi.object(reqObj).or('email_downloaded', 'cv_downloaded');
        const { error } = schema.validate(reqParam);

        if (error) {
            console.log(error);
            try {
                return Response.validationErrorResponseData(
                    res,
                    res.__(
                        Helper.validationMessageKey(
                            "Resume Access Data validation",
                            error
                        )
                    )
                );
            } catch (errors) {
                return Response.validationErrorResponseData(
                    res,
                    res.__(error.details[0].message)
                );
            }
        }


        let subscriptionDetails = await SubscribedUser.findOne({
            where: {
                id: reqParam.user_subscribed_id,
            }
        })

        let EmailLimitCount = await ResumeAccessData.count({
            where: {
                email_downloaded: YES,
                user_subscribed_id: reqParam.user_subscribed_id,
                user_id: authUserId,
            }
        })

        let CvLimitCount = await ResumeAccessData.count({
            where: {
                cv_downloaded: YES,
                user_subscribed_id: reqParam.user_subscribed_id,
                user_id: authUserId,
            }
        })

        if (reqParam.email_downloaded && EmailLimitCount >= subscriptionDetails.email_limit) {
            return Response.successResponseWithoutData(
                res,
                res.locals.__('Email limit Exceeded'),
                FAIL
            )
        }

        if (reqParam.cv_downloaded && CvLimitCount >= subscriptionDetails.cv_limit) {
            return Response.successResponseWithoutData(
                res,
                res.locals.__('CV limit Exceeded'),
                FAIL
            )
        }


        await ResumeAccessData.findOne({
            where: {
                user_id: authUserId,
                [Op.or]: {
                    email_downloaded: reqParam.email_downloaded ? reqParam.email_downloaded : NO,
                    cv_downloaded: reqParam.cv_downloaded ? reqParam.cv_downloaded : NO,
                },
                user_subscribed_id: reqParam.user_subscribed_id,
                info_accessed_user_id: reqParam.info_accessed_user_id,
            }
        }).then(obj => {
            // update
            if (obj)
                return obj.update({
                    email_downloaded: reqParam.email_downloaded,
                    cv_downloaded: reqParam.cv_downloaded,
                }).then(data => {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__(
                            "Resume access updated successfully"
                        )
                    );
                })

            // insert
            return ResumeAccessData.create({
                user_id: authUserId,
                email_downloaded: reqParam.email_downloaded,
                cv_downloaded: reqParam.cv_downloaded,
                user_subscribed_id: reqParam.user_subscribed_id,
                info_accessed_user_id: reqParam.info_accessed_user_id
            }).then(data => {
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__(
                        "Resume access added successfully"
                    )
                );
            })

        }).catch(error => console.log(" :: error ::", error))
    }

};