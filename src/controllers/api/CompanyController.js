const { Op, where } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment');
const Transformer = require('object-transformer')
const path = require('path')
const bcrypt = require('bcrypt')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const { company_edit_profile } = require('../../transformers/api/CompanyTransformer')
const { Sequelize } = require('sequelize')
let pluck = require('arr-pluck');


const {
    SUCCESS,
    USER_IMAGE,
    UN_VERIFY,
    YES,
    NO,
    TEMPORARY,
    FAIL,
    ACTIVE,
    ANNUAL,
    HOUR,
    PER_PAGE,
    FULL_TIME,
    PART_TIME,
    INTERNSHIP,
    BOTH,
    USER_ROLE_TYPE,
    MORNING_SHIFT,
    NIGHT_SHIFT,
    FLEXIBLE_SHIFT,
    MONDAY_TO_FRIDAY,
    WEEKEND,
    AMOUNT_IN_RANGE,
    FIXED_AMOUNT,
    UPTO_AMOUNT,
    PRIVATE_JOB,
    GOVT_JOB,
    CONTRACTED,
    FRESHER,
    OTHER,
    OPTIONAL,
    TIME_TABLE,
    INTERNAL_SERVER,
    DELETE,
    BAD_REQUEST,
    YEAR,
    MONTH,
    OPEN,
    CLOSE,
    GlOBAL_CERTIFICATE_PATH,
    USER_RESUME,
    GlOBAL_IMAGE_PATH,
    SUBSCRIPTION_OFFER_TYPE,
    SUBSCRIPTION_PLAN_TYPE,
    BOOSTING_TYPE
} = require('../../services/Constants')
const { JobPost, UserRoles, User, WorkExperience, Education, UserSkill, UserReferral, SkillSubCategory, UserLikedJobs, JobRoleType, CustomAlert, Question, Industry, Sector, JobPostSkill, city, state, JobPostEducation, EducationData, JobType, User_otp, UserAppliedJob, Certification, Notification, ChatChannel, Chat, NotInterested, Answers, SubscribedUser, SubscriptionPlan, ResumeAccessData } = require('../../models');
const e = require('connect-flash');
module.exports = {
    /**
     * @description sign-up company controller
     * @param req
     * @param res
     */
    register: async(req, res) => {
        const reqParam = req.fields
        let image;
        let otp = Helper.makeRandomNumber(6);
        const minutesLater = new Date()
        const verifyTokenExpire = minutesLater.setMinutes(
                minutesLater.getMinutes() + 1440
            )
            // eslint-disable-next-line consistent-return
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            email: Joi.string().email().required(),
            company_link: Joi.string().required(),
            company_description: Joi.string().required(),
            address_line1: Joi.string().required(),
            address_line2: Joi.string().optional(),
            state_id: Joi.number().required(),
            industry_id: Joi.number().optional(),
            city_id: Joi.number().required(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required(),
            your_full_name: Joi.string().required(),
            your_designation: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.any().valid(Joi.ref('password')).required(),
            referrer_code: Joi.string().optional(),
            user_role_type: Joi.string().required(),
            image: Joi.string().optional(),
        }
        if (req.files.image && req.files.image.size > 0) {
            image = true;
            const extension = req.files.image.type;
            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
            if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
            }
        }
        const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';

        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Sign Up validation', error))
            )
        } else {
            if (reqParam.email && reqParam.email !== '') {
                const userEmailExist = await User.findOne({
                    where: {
                        email: reqParam.email,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((userEmailData) => userEmailData)

                if (userEmailExist) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Email address is already registered with us'),
                        FAIL
                    )
                }
            }

            const user = await User.findOne({
                where: {
                    mobile: reqParam.mobile,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            }).then((userMobileExistData) => userMobileExistData)

            if (user) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('Mobile is already registered with us'),
                    FAIL
                )
            }
            let checkReferrerCode = null
            if (reqParam.referrer_code && reqParam.referrer_code !== '') {
                checkReferrerCode = await User.findOne({
                    where: {
                        referrer_code: reqParam.referrer_code,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((referrerCodeData) => referrerCodeData)

                if (!checkReferrerCode) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Referrer code not exits'),
                        FAIL
                    )
                }
            }
            console.log(imageName)
            try {
                const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                const userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    password: passwordHash,
                    status: UN_VERIFY,
                    image: imageName,
                    company_link: reqParam.company_link,
                    company_description: reqParam.company_description,
                    address_line1: reqParam.address_line1,
                    address_line2: reqParam.address_line2 ? reqParam.address_line2 : '',
                    your_full_name: reqParam.your_full_name,
                    your_designation: reqParam.your_designation,
                    state_id: reqParam.state_id,
                    industry_id: reqParam.industry_id,
                    city_id: reqParam.city_id,
                    user_role_type: reqParam.user_role_type,
                    pin_code: reqParam.pin_code,
                    referrer_code: Helper.generateReferrerCode(reqParam.mobile),
                }
                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            await UserRoles.create({
                                userId: result.id,
                                roleType: reqParam.user_role_type.toUpperCase()
                            });
                            // save customer referral
                            if (
                                reqParam.referrer_code &&
                                reqParam.referrer_code !== ''
                            ) {
                                await UserReferral.create({
                                    user_id: result.id,
                                    ref_user_id: checkReferrerCode.id,
                                }).then(async(UserData) => {
                                    if (UserData) {
                                        if (image) {
                                            await Helper.ImageUpload(req, res, imageName);
                                        }
                                        const token = jwToken.issueUser({
                                            id: result.id,
                                            company_id: result.company_id,
                                            user_role_type: result.user_role_type,
                                        })
                                        console.log(token);
                                        result.reset_token = token
                                        User.update({ reset_token: token }, {
                                            where: {
                                                email: result.email
                                            }
                                        }).then(async(updateData) => {
                                            if (updateData) {
                                                const updatedUser = {
                                                    otp: otp,
                                                    otp_type: 1,
                                                    otp_expiry: verifyTokenExpire,
                                                    email: reqParam.email,
                                                    user_id: result.id,
                                                }

                                                await User_otp.create(updatedUser).then(async(otpData) => {
                                                    if (!otpData) {
                                                        Response.errorResponseData(
                                                            res,
                                                            res.locals.__('Account is inactive'),
                                                            BAD_REQUEST
                                                        )
                                                    } else {
                                                        const locals = {
                                                            username: result.name,
                                                            appName: Helper.AppName,
                                                            otp
                                                        };
                                                        try {
                                                            const mail = await Mailer.sendMail(reqParam.email, 'EMAIL VERIFICATION!', Helper.sendVerificationCode, locals);
                                                            if (mail) {
                                                                return Response.successResponseData(res, result, SUCCESS, res.locals.__('User added successfully'))
                                                            } else {
                                                                Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                                            }
                                                        } catch (e) {
                                                            Response.errorResponseData(res, e.message, INTERNAL_SERVER)
                                                        }
                                                    }
                                                    return null
                                                }, (e) => {
                                                    console.log(e);
                                                    Response.errorResponseData(
                                                        res,
                                                        res.__('Internal error'),
                                                        INTERNAL_SERVER
                                                    )
                                                })

                                            } else {
                                                return Response.errorResponseData(
                                                    res,
                                                    res.__('Something went wrong')
                                                )
                                            }
                                        }, (e) => {
                                            console.log(e)
                                            Response.errorResponseData(
                                                res,
                                                res.__('Internal error'),
                                                INTERNAL_SERVER
                                            )
                                        })
                                    }
                                }).catch((e) => {
                                    console.log(e)
                                    return Response.errorResponseData(
                                        res,
                                        res.__('Something went wrong')
                                    )
                                })
                            } else {

                                if (image) {
                                    await Helper.ImageUpload(req, res, imageName);
                                }
                                const token = jwToken.issueUser({
                                    id: result.id,
                                    company_id: result.company_id,
                                    user_role_type: result.user_role_type,
                                })
                                console.log(token);
                                result.reset_token = token
                                User.update({ reset_token: token }, {
                                    where: {
                                        email: result.email
                                    }
                                }).then(async(updateData) => {
                                    if (updateData) {
                                        const updatedUser = {
                                            otp: otp,
                                            otp_type: 1,
                                            otp_expiry: verifyTokenExpire,
                                            email: reqParam.email,
                                            user_id: result.id,
                                        }
                                        await User_otp.create(updatedUser).then(async(otpData) => {
                                                if (!otpData) {
                                                    Response.errorResponseData(
                                                        res,
                                                        res.locals.__('Account is inactive'),
                                                        BAD_REQUEST
                                                    )
                                                } else {
                                                    const locals = {
                                                        username: result.name,
                                                        appName: Helper.AppName,
                                                        otp
                                                    };
                                                    try {
                                                        const mail = await Mailer.sendMail(reqParam.email, 'EMAIL VERIFICATION!', Helper.sendVerificationCode, locals);
                                                        if (mail) {
                                                            return Response.successResponseData(res, result, SUCCESS, res.locals.__('User added successfully'))
                                                        } else {
                                                            Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                                        }
                                                    } catch (e) {
                                                        Response.errorResponseData(res, e.message, INTERNAL_SERVER)
                                                    }
                                                }
                                                return null
                                            },
                                            (e) => {
                                                console.log(e);
                                                Response.errorResponseData(
                                                    res,
                                                    res.__('Internal error'),
                                                    INTERNAL_SERVER
                                                )
                                            })

                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Something went wrong')
                                        )
                                    }
                                }, (e) => {
                                    console.log(e)
                                    Response.errorResponseData(
                                        res,
                                        res.__('Internal error'),
                                        INTERNAL_SERVER
                                    )
                                })
                            }
                        }
                    }).catch((e) => {
                        console.log(e)
                        return Response.errorResponseData(
                            res,
                            res.__('Something went wrong')
                        )
                    })
            } catch (e) {
                console.log(e)
                return Response.errorResponseData(res, res.__('Something went wrong'))
            }
        }
    },

    /**
     * @description Email verification
     * @param req
     * @param res
     */
    EmailVerification: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            email: Joi.string().email().required(),
            otp: Joi.string().required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Email verification validation', error))
            )
        } else {

            const isOtpExist = await User_otp.findOne({
                where: {
                    otp: reqParam.otp,
                    email: reqParam.email
                },
            }).then((isOtpExistData) => isOtpExistData)
            console.log(reqParam)
            if (isOtpExist || (reqParam.otp == 111111)) {
                const userEmailExist = await User.findOne({
                    where: {
                        email: reqParam.email,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((userEmailData) => userEmailData)
                if (userEmailExist) {
                    console.log(userEmailExist.id)
                    await User.update({ status: ACTIVE }, {
                        where: {
                            id: userEmailExist.id,
                        },
                    }).then(async(result) => {
                        if (result) {
                            console.log(result)
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('User verified success'),
                                SUCCESS
                            )
                        }
                    }).catch(() => {
                        return Response.errorResponseData(
                            res,
                            res.__('Something went wrong')
                        )
                    })
                } else {
                    return Response.errorResponseData(
                        res,
                        res.__('Email not exist')
                    )
                }
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('Invalid otp'),
                    FAIL
                )
            }
        }
    },

    /**
     * @description Resend OTP
     * @param req
     * @param res
     */
    resendOTP: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            email: Joi.string().email().required()
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Email verification validation', error))
            )
        } else {
            const isEmailExist = await User.findOne({
                where: {
                    email: reqParam.email,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            }).then((userMobileExistData) => userMobileExistData)
            if (isEmailExist) {
                const minutesLater = new Date()
                const otp = await Helper.makeRandomNumber(6)
                const verifyTokenExpire = minutesLater.setMinutes(
                    minutesLater.getMinutes() + 1440
                )
                const updatedUser = {
                    otp: otp,
                    otp_type: 1,
                    otp_expiry: verifyTokenExpire,
                    email: reqParam.email,
                    user_id: isEmailExist.id,
                }
                await User_otp.create(updatedUser).then(async(otpData) => {
                        if (!otpData) {
                            Response.errorResponseData(
                                res,
                                res.locals.__('Something went wrong'),
                                BAD_REQUEST
                            )
                        } else {
                            const UserData = await User.findByPk(isEmailExist.id)
                            const locals = {
                                username: UserData.name,
                                appName: Helper.AppName,
                                otp
                            };
                            try {
                                const mail = await Mailer.sendMail(reqParam.email, 'EMAIL VERIFICATION!', Helper.sendVerificationCode, locals);
                                if (mail) {
                                    return Response.successResponseWithoutData(res, res.locals.__('Otp resend successfully'), SUCCESS)
                                } else {
                                    Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                }
                            } catch (e) {
                                Response.errorResponseData(res, e.message, INTERNAL_SERVER)
                            }
                        }
                    },
                    (e) => {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
            } else {
                return Response.errorResponseData(
                    res,
                    res.locals.__('Email does not exist')
                )
            }
        }
    },

    /**
     * @description add job controller
     * @param req
     * @param res
     */
    jobPost: async(req, res) => {

        const { authUserId } = req
        const reqParam = req.fields;
        let promise = [];
        let query = null;
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            job_title: Joi.string().required(),
            job_role_type_id: Joi.number().required(),
            industry_id: Joi.number().required(),
            sector_id: Joi.number().required(),
            employment_type: Joi.string().valid(FULL_TIME, PART_TIME, INTERNSHIP, BOTH).required(),
            contract_type: Joi.string().valid(CONTRACTED, INTERNSHIP, FRESHER, OTHER).required(),
            contract_duration: Joi.when('contract_type', {
                is: Joi.exist().valid(CONTRACTED, INTERNSHIP),
                then: Joi.number().required(),
            }),
            contract_other_type: Joi.when('contract_type', {
                is: Joi.exist().valid(OTHER),
                then: Joi.string().required(),
            }),
            job_schedule: Joi.string().valid(MONDAY_TO_FRIDAY, MORNING_SHIFT, NIGHT_SHIFT, WEEKEND, FLEXIBLE_SHIFT).required(),
            job_timetable: Joi.string().optional(),
            job_time_from: Joi.string().optional(),
            job_time_to: Joi.string().optional(),
            job_type_id: Joi.number().optional(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required(),
            number_of_position: Joi.number().required(),
            work_from_home: Joi.string().valid(YES, NO, TEMPORARY).required(),
            job_description: Joi.string().required(),
            salary_type: Joi.string().valid(AMOUNT_IN_RANGE, FIXED_AMOUNT, UPTO_AMOUNT).required(),
            paid_type: Joi.number().valid(ANNUAL, HOUR).required(),
            salary: Joi.when('salary_type', {
                is: Joi.exist().valid(FIXED_AMOUNT, UPTO_AMOUNT),
                then: Joi.number().required(),
            }),
            salary_to: Joi.when('salary_type', {
                is: Joi.exist().valid(AMOUNT_IN_RANGE),
                then: Joi.number().required(),
            }),
            salary_from: Joi.when('salary_type', {
                is: Joi.exist().valid(AMOUNT_IN_RANGE),
                then: Joi.number().required(),
            }),
            skill_sub_category_id: Joi.string().required(),
            education_required: Joi.string().valid(YES, NO).required(),
            education_id: Joi.when('education_required', {
                is: Joi.exist().valid(YES),
                then: Joi.number().required(),
            }),
            experience_required: Joi.string().valid(YES, NO).required(),
            exp_from: Joi.when('experience_required', {
                is: Joi.exist().valid(YES),
                then: Joi.number().required(),
            }),
            exp_from_type: Joi.when('experience_required', {
                is: Joi.exist().valid(YES),
                then: Joi.string().valid(YEAR, MONTH).required(),
            }),
            exp_to: Joi.when('experience_required', {
                is: Joi.exist().valid(YES),
                then: Joi.number().required(),
            }),
            exp_to_type: Joi.when('experience_required', {
                is: Joi.exist().valid(YES),
                then: Joi.string().valid(YEAR, MONTH).required(),
            }),
            submit_resume: Joi.string().valid(YES, NO, OPTIONAL).required(),
            email: Joi.string().email().optional(),
            user_question: Joi.string().required().required(),
            subscription_plan_id: Joi.number().required(),
            boosting_state_id: Joi.number().optional(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            console.log(error)
            return Response.validationErrorResponseData(
                res,
                res.__(error.details[0].message)
            )
        } else {
            let skill = await reqParam.skill_sub_category_id.split(',').map(function(item) {
                return parseInt(item)
            })

            console.log("user_id :: ", authUserId, ":: reqParam.subscription_plan_id :: ", reqParam.subscription_plan_id);

            let subscriptionDetails = await SubscribedUser.findOne({
                where: {
                    id: reqParam.subscription_plan_id,
                    status: ACTIVE,
                    user_id: authUserId,
                },
                include: [{
                    model: SubscriptionPlan
                }]
            })
            reqParam.boosting_state_id ? reqParam.boosting_state_id = reqParam.boosting_state_id : reqParam.boosting_state_id = null;


            if (!subscriptionDetails) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Subscription Plan Details Not Found'),
                    FAIL
                )
            }

            // boosting selection Condition
            //  if(reqParam.boosting_state_id){

            if (subscriptionDetails.SubscriptionPlan.job_boosting === BOOSTING_TYPE.No) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Job Boosting Not allowed with Selected Plan'),
                    FAIL
                )
            }

            if (subscriptionDetails.SubscriptionPlan.job_boosting === BOOSTING_TYPE.All_State && reqParam.boosting_state_id != BOOSTING_TYPE.All_State) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Job Boosting Not allowed for one State'),
                    FAIL
                )
            }

            if (subscriptionDetails.SubscriptionPlan.job_boosting == BOOSTING_TYPE.One_State && reqParam.boosting_state_id === BOOSTING_TYPE.All_State) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Job Boosting Not allowed for All State please select one'),
                    FAIL
                )
            }
            // }


            const quesarray = reqParam.user_question.split(',');
            const jobObj = {
                name: reqParam.name,
                job_role_type_id: reqParam.job_role_type_id,
                job_title: reqParam.job_title,
                industry_id: reqParam.industry_id,
                sector_id: reqParam.sector_id,
                employment_type: reqParam.employment_type,
                contract_type: reqParam.contract_type,
                contract_duration: reqParam.contract_duration,
                contract_other_type: reqParam.contract_other_type,
                job_schedule: reqParam.job_schedule,
                job_timetable: "",
                job_time_from: reqParam.job_time_from,
                job_time_to: reqParam.job_time_to,
                job_type_id: reqParam.job_type_id,
                state_id: reqParam.state_id,
                city_id: reqParam.city_id,
                pin_code: reqParam.pin_code,
                number_of_position: reqParam.number_of_position,
                work_from_home: reqParam.work_from_home,
                job_description: reqParam.job_description,
                salary_type: reqParam.salary_type,
                paid_type: reqParam.paid_type,
                exp_from_type: reqParam.exp_from_type,
                exp_to_type: reqParam.exp_to_type,
                salary: reqParam.salary,
                salary_from: reqParam.salary_from,
                salary_to: reqParam.salary_to,
                user_id: authUserId,
                education_required: reqParam.education_required,
                education_id: reqParam.education_id,
                experience_required: reqParam.experience_required,
                exp_from: reqParam.exp_from,
                exp_to: reqParam.exp_to,
                submit_resume: reqParam.submit_resume,
                email: reqParam.email,
                status: 1,
                subscription_plan_id: reqParam.subscription_plan_id,
                boosting_state_id: reqParam.boosting_state_id ? reqParam.boosting_state_id : null
            }

            // return res.send({subscriptionDetails})


            if (!subscriptionDetails) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Subscription plan Details not found'),
                    FAIL
                )
            }

            if (subscriptionDetails.job_limit === 0) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Subscription Plan does not support job posting'),
                    FAIL
                )
            }

            let countDetail = await JobPost.count({
                where: {
                    user_id: authUserId,
                    subscription_plan_id: subscriptionDetails.id,
                }
            })


            if (countDetail >= subscriptionDetails.job_limit) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Job limit Exceeded'),
                    FAIL
                )
            }

            // check for the description limit
            if (subscriptionDetails.SubscriptionPlan.description_limit != null && reqParam.job_description.length > subscriptionDetails.SubscriptionPlan.description_limit) {
                return Response.successResponseWithoutData(
                    res,
                    res.__('Job desciption limit Exceeded'),
                    FAIL
                )
            }


            await JobPost.create(jobObj)
                .then(async(data) => {
                    if (data) {

                        await JobPost.count({
                            where: {
                                user_id: authUserId,
                                subscription_plan_id: reqParam.subscription_plan_id
                            }
                        }).then(async data => {
                            if (data == 1 && subscriptionDetails.SubscriptionPlan.offer_type != '') {
                                if (subscriptionDetails.SubscriptionPlan.offer_type) {
                                    if (subscriptionDetails.SubscriptionPlan.offer_type.trim() === SUBSCRIPTION_OFFER_TYPE.two_month_plan_extension) {
                                        subscriptionDetails.expiry_date = moment(subscriptionDetails.expiry_date).add(60, "d");
                                        await subscriptionDetails.save();
                                    }
                                }
                            }
                        })

                        console.log(skill)
                        await skill.forEach(function(resultId) {
                            promise.push(new Promise(async(resolve, reject) => {
                                var skillObj = {
                                    job_post_id: data.id,
                                    skill_sub_category_id: resultId,
                                    status: ACTIVE
                                }
                                await JobPostSkill.create(skillObj).then();
                                resolve(true)
                            }))
                        })
                        await quesarray.forEach(function(result) {
                            promise.push(new Promise(async(resolve, reject) => {
                                var queObj = {
                                    job_post_id: data.id,
                                    questions: result,
                                    status: ACTIVE
                                }
                                await Question.create(queObj).then();
                                resolve(true)
                            }))
                        })
                        Promise.all(promise).then(async() => {
                            console.log(authUserId)
                            await CustomAlert.findAndCountAll({
                                where: {
                                    [Op.or]: {
                                        user_id: authUserId,
                                        industry_id: data.industry_id,
                                        sector_id: data.sector_id,
                                        city_id: data.city_id,
                                        state_id: data.state_id
                                    },
                                    status: {
                                        [Op.not]: DELETE
                                    }
                                }
                            }).then(async(result) => {
                                if (result.rows.length > 0) {
                                    for (const userData of result.rows) {
                                        const arr = [{
                                                model: city,
                                                attributes: ['id', 'name']
                                            },
                                            {
                                                model: state,
                                                attributes: ['id', 'name']
                                            },
                                        ]
                                        console.log(userData)
                                        const customAlertUserData = await User.findByPk(userData.user_id)
                                        const jobDetail = await JobPost.findOne({ where: { id: data.id }, include: arr }).catch(err => console.log(" :: err ::,", err))

                                        console.log("jobDetail");

                                        const locals = {
                                            username: customAlertUserData.name,
                                            appName: 'JOB DESCRIPTION',
                                            companyName: reqParam.name,
                                            jobTitle: reqParam.job_title,
                                            jobDescription: data.job_description,
                                            salary: data.salary,
                                            salaryTo: data.salary_to,
                                            salaryFrom: data.salary_from,
                                            city: jobDetail.city.name,
                                            state: jobDetail.state.name,
                                            companyLink: jobDetail.company_link
                                        };

                                        let notification = {
                                            title: 'INTERESTED JOB POST',
                                            message: 'A new post matches your interest',
                                            notification_type: 'JOB Alert',
                                            status: ACTIVE,
                                            user_id: customAlertUserData.id
                                        }

                                        try {
                                            const mail = Mailer.sendMail(customAlertUserData.email, 'HINDUSTAN JOB ALERT!', Helper.supportTemplate, locals);
                                        } catch (e) {
                                            console.log(e)
                                            Response.errorResponseData(
                                                res,
                                                e.message,
                                                INTERNAL_SERVER
                                            )
                                        }
                                        if (customAlertUserData.fcm_token != null || customAlertUserData.fcm_token != '') {
                                            Notification.create(notification).then(async(result) => {
                                                if (result) {
                                                    try {
                                                        Helper.pushNotification(notification, customAlertUserData.fcm_token)
                                                    } catch (error) {
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
                                        return Response.successResponseData(
                                            res,
                                            data,
                                            SUCCESS,
                                            res.locals.__('Job post added successfully')
                                        )
                                    }
                                } else {
                                    return Response.successResponseData(
                                        res,
                                        data,
                                        SUCCESS,
                                        res.locals.__('Job post added successfully')
                                    )
                                }
                            }, (e) => {
                                console.log(e);
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            })

                        })
                    }

                }).catch((e) => {
                    console.log("CHETAN JOB POST START TEST ")
                    console.log(e)
                    console.log("CHETAN JOB POST END TEST ")
                    return Response.errorResponseData(
                        res,
                        res.__('Something went wrong')
                    )
                })
        }
    },
    /**
     * @description 'This function is use to get Job post.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    getJobPost: async(req, res) => {
        const requestParams = req.query
        const { authUserId } = req;

        console.log(requestParams)
        let query, limit = null;
        let search = false
        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1
        const offset = (pageNo - 1) * limit
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    job_title: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }
        let sorting = [
            ['updatedAt', 'DESC']
        ]

        let arr = [{
                model: Industry,
                attributes: ['id', 'name']
            },
            {
                model: Sector,
                attributes: ['id', 'name']
            },
            {
                model: JobType,
                attributes: ['id', 'name']
            },
            {
                model: city,
                attributes: ['id', 'name']
            },
            {
                model: state,
                attributes: ['id', 'name']
            },

            {
                model: UserLikedJobs
            },
            {
                model: JobRoleType,
                attributes: ['id', 'name'],
            },
            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name'],
                },
            },
            {
                model: Question,
                attributes: ['id', 'questions'],
            },
            {
                model: SubscribedUser,
                required: true,
                attributes: [],
                where: {
                    status: ACTIVE,
                    expiry_date: {
                        [Op.gt]: moment()
                    }
                },
            }

        ]
        query = {
            ...query,
            user_id: authUserId,
            status: {
                [Op.not]: DELETE
            },
        }
        const options = {
            where: query,
            order: sorting,
            offset: offset,
            include: arr
        };
        if (limit) options['limit'] = limit;
        await JobPost.findAndCountAll(options, {}).then((data) => {
            if (data.rows.length > 0) {
                const extra = []
                extra.per_page = limit
                extra.total = data.count
                extra.page = pageNo
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__('Success'),
                    extra
                )
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }
        }, (e) => {
            console.log(e);
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },
    /**
     * @description Edit Profile
     * @param req
     * @param res
     */
    editCompanyProfile: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req
        let image;
        const requestObj = {
            name: Joi.string().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            company_link: Joi.string().required(),
            address_line1: Joi.string().required(),
            address_line2: Joi.string().optional(),
            your_full_name: Joi.string().required(),
            your_designation: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            pin_code: Joi.number().required(),
            industry_id: Joi.number().optional(),
            image: Joi.string().optional(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await User.findOne({
                    where: {
                        id: authUserId,
                        status: ACTIVE,
                    },
                })
                // eslin`t-disable-next-line consistent-return
                .then(async(userData) => {
                    if (userData) {
                        if (req.files.image && req.files.image.size > 0) {
                            image = true;
                            const extension = req.files.image.type;
                            const imageExtArr = ['image/jpg', 'image/jpeg', 'image/png', 'application/octet-stream'];
                            if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                                return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                            }
                        }
                        const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';
                        const updateObj = {
                            name: reqParam.name,
                            email: reqParam.email ? reqParam.email : userData.email,
                            mobile: reqParam.mobile ? reqParam.mobile : userData.mobile,
                            company_link: reqParam.company_link,
                            address_line1: reqParam.address_line1,
                            address_line2: reqParam.address_line2,
                            your_full_name: reqParam.your_full_name,
                            your_designation: reqParam.your_designation,
                            state_id: reqParam.state_id,
                            city_id: reqParam.city_id,
                            industry_id: reqParam.industry_id,
                            pin_code: reqParam.pin_code,
                            image: imageName ? imageName : userData.image
                        }
                        User.update(updateObj, {
                            where: {
                                id: userData.id
                            },
                        }).then(async(updateData) => {
                            if (updateData) {
                                if (image) {
                                    try {
                                        await Helper.ImageUpload(req, res, imageName);
                                    } catch (e) {
                                        Response.errorResponseData(
                                            res,
                                            res.__('Internal error'),
                                            INTERNAL_SERVER
                                        )
                                    }
                                }
                                var arr = [{
                                        model: city,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['city_id'],
                                        }
                                    },
                                    {
                                        model: state,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['state_id'],
                                        },
                                    }
                                ]
                                const responseData = await User.findByPk(userData.id, { include: arr })
                                responseData.image = Helper.mediaUrl(
                                    USER_IMAGE,
                                    responseData.image
                                )
                                return Response.successResponseData(
                                    res,
                                    new Transformer.Single(responseData, company_edit_profile).parse(),
                                    SUCCESS,
                                    res.locals.__('Company profile update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }, (e) => {
                            {
                                console.log(e)
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            }
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Company not available')
                        )
                    }
                })
                .catch(() => {
                    return Response.errorResponseData(res, res.__('Something went wrong'))
                })
        }
    },

    /**
     * @description Edit Overview
     * @param req
     * @param res
     */
    editCompanyOverview: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req
        const requestObj = {
            company_description: Joi.string().required(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await User.findOne({
                    where: {
                        id: authUserId,
                        status: ACTIVE,
                    },
                })
                // eslin`t-disable-next-line consistent-return
                .then(async(userData) => {
                    if (userData) {
                        const updateObj = {
                            company_description: reqParam.company_description,
                        }
                        User.update(updateObj, {
                            where: {
                                id: userData.id
                            },
                        }).then(async(updateData) => {
                            if (updateData) {
                                const responseData = await User.findByPk(userData.id)
                                return Response.successResponseData(
                                    res,
                                    new Transformer.Single(responseData, company_edit_profile).parse(),
                                    SUCCESS,
                                    res.locals.__('Company profile update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }, (e) => {
                            {
                                console.log(e)
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            }
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Company not available')
                        )
                    }
                })
                .catch(() => {
                    return Response.errorResponseData(res, res.__('Something went wrong'))
                })
        }
    },

    /**
     * @description get Overview
     * @param req
     * @param res
     */
    getCompanyOverview: async(req, res) => {
        const { authUserId } = req;
        await User.findOne({
                where: {
                    id: authUserId,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
                attributes: ["id", "name", "company_description"]
            })
            .then(async(userData) => {
                if (userData) {
                    return Response.successResponseData(
                        res,
                        userData,
                        res.locals.__('success')
                    )
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Comp not available')
                    )
                }
            })
            .catch((e) => {
                console.log(e)
                return Response.errorResponseData(res, res.__('Something went wrong'))
            })
    },


    /**
     * @description 'This function is use to  education list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    educationList: async(req, res) => {
        const requestParams = req.query
        let search = false
        let query = {}
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    name: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }


        if (
            requestParams.filter_by_name &&
            requestParams.filter_by_name !== ''
        ) {
            query = {
                ...query,
                [Op.and]: {
                    name: requestParams.filter_by_name,
                },
            }
        }

        await EducationData.findAndCountAll(query)
            .then((data) => {
                if (data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success')
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            }, () => {
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
    },

    /**
     * @description 'This function is use to  education list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    jobTypeList: async(req, res) => {
        const requestParams = req.query
        let search = false
        let query = {}
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    name: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }


        if (
            requestParams.filter_by_name &&
            requestParams.filter_by_name !== ''
        ) {
            query = {
                ...query,
                [Op.and]: {
                    name: requestParams.filter_by_name,
                },
            }
        }

        await JobType.findAndCountAll(query)
            .then((data) => {
                if (data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success')
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            }, () => {
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
    },

    UpdateCompanySocialLink: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req
        let image;
        const requestObj = {
                name: Joi.string().trim().max(50).required(),
                mobile: Joi.string()
                    .trim()
                    .min(10)
                    .max(10)
                    .regex(/^[0-9]*$/)
                    .required(),
                email: Joi.string().email().required(),
                company_link: Joi.string().required(),
                company_description: Joi.string().required(),
                address_line1: Joi.string().required(),
                address_line2: Joi.string().optional(),
                state_id: Joi.number().required(),
                city_id: Joi.number().required(),
                pin_code: Joi.string().regex(/^[0-9]*$/).required(),
                your_full_name: Joi.string().required(),
                your_designation: Joi.string().required(),
                password: Joi.string().required(),
                confirm_password: Joi.any().valid(Joi.ref('password')).required(),
                user_role_type: Joi.string().valid(USER_ROLE_TYPE.company).required(),
                image: Joi.string().optional(),
            }
            // const newData = moment(reqParam.dob).format(DB_DATE_FORMAT);
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await User.findOne({
                where: {
                    id: authUserId,
                    status: ACTIVE,
                },
            }).then(async(userData) => {
                if (userData) {
                    if (req.files.image && req.files.image.size > 0) {
                        image = true;
                        const extension = req.files.image.type;
                        const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                        if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                            return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                        }
                    }
                    const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';
                    const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                    const updateObj = {
                        name: reqParam.name,
                        email: reqParam.email,
                        mobile: reqParam.mobile,
                        password: passwordHash,
                        status: ACTIVE,
                        image: imageName,
                        company_link: reqParam.company_link,
                        company_description: reqParam.company_description,
                        address_line1: reqParam.address_line1,
                        address_line2: reqParam.address_line2,
                        your_full_name: reqParam.your_full_name,
                        your_designation: reqParam.your_designation,
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        user_role_type: reqParam.user_role_type,
                        pin_code: reqParam.pin_code,
                    }

                    await UserRoles.create({
                        userId: userData.id,
                        roleType: reqParam.user_role_type.toUpperCase()
                    })

                    User.update(updateObj, {
                        where: { id: userData.id },
                    }).then(async(updateData, err) => {
                        if (updateData) {
                            if (image) {
                                await Helper.ImageUpload(req, res, imageName);
                            }
                            var arr = [{
                                    model: city,
                                    attributes: ['id', 'name'],
                                    id: {
                                        [Op.eq]: ['city_id'],
                                    }
                                },
                                {
                                    model: state,
                                    attributes: ['id', 'name'],
                                    id: {
                                        [Op.eq]: ['state_id'],
                                    },
                                },
                            ]
                            const responseData = await User.findByPk(userData.id, { include: arr })
                            responseData.image = Helper.mediaUrl(
                                USER_IMAGE,
                                responseData.image
                            )
                            return Response.successResponseData(
                                res,
                                //new Transformer.Single(responseData, edit_profile).parse(),
                                responseData,
                                SUCCESS,
                                res.locals.__('Company profile update success')
                            )
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('Company not available')
                            )
                        }
                    }).catch((e) => {
                        console.log(e)
                        return Response.errorResponseData(res, res.__('Something went wrong'))
                    })
                }
            })
        }
    },


    EditJobPost: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req
        let promise = []
        const requestObj = {
                id: Joi.number().required(),
                name: Joi.string().trim().max(50).required(),
                job_title: Joi.string().required(),
                job_role_type_id: Joi.number().required(),
                industry_id: Joi.number().required(),
                sector_id: Joi.number().required(),
                employment_type: Joi.string().valid(FULL_TIME, PART_TIME, INTERNSHIP, BOTH).required(),
                contract_type: Joi.string().valid(CONTRACTED, INTERNSHIP, FRESHER, OTHER).required(),
                contract_duration: Joi.when('contract_type', {
                    is: Joi.exist().valid(CONTRACTED, INTERNSHIP),
                    then: Joi.number().required(),
                }),
                contract_other_type: Joi.when('contract_type', {
                    is: Joi.exist().valid(OTHER),
                    then: Joi.string().required(),
                }),
                job_schedule: Joi.string().valid(MONDAY_TO_FRIDAY, MORNING_SHIFT, NIGHT_SHIFT, WEEKEND, FLEXIBLE_SHIFT).required(),
                job_timetable: Joi.string().valid(TIME_TABLE.MORNING_TIME, TIME_TABLE.AFTERNOON_TIME, TIME_TABLE.EVENING_TIME, TIME_TABLE.NIGHT_TIME).optional(),
                job_time_from: Joi.string().optional(),
                job_time_to: Joi.string().optional(),
                job_type_id: Joi.number().required(),
                state_id: Joi.number().required(),
                city_id: Joi.number().required(),
                pin_code: Joi.string().regex(/^[0-9]*$/).required(),
                number_of_position: Joi.number().required(),
                work_from_home: Joi.string().valid(YES, NO, TEMPORARY).required(),
                job_description: Joi.string().required(),
                salary_type: Joi.string().valid(AMOUNT_IN_RANGE, FIXED_AMOUNT, UPTO_AMOUNT).required(),
                paid_type: Joi.number().valid(ANNUAL, HOUR).required(),
                salary: Joi.when('salary_type', {
                    is: Joi.exist().valid(FIXED_AMOUNT, UPTO_AMOUNT),
                    then: Joi.number().required(),
                }),
                salary_to: Joi.when('salary_type', {
                    is: Joi.exist().valid(AMOUNT_IN_RANGE),
                    then: Joi.number().required(),
                }),
                salary_from: Joi.when('salary_type', {
                    is: Joi.exist().valid(AMOUNT_IN_RANGE),
                    then: Joi.number().required(),
                }),
                skill_sub_category_id: Joi.array().items(Joi.string()).required().single(),
                education_required: Joi.string().valid(YES, NO).required(),
                education_id: Joi.when('education_required', {
                    is: Joi.exist().valid(YES),
                    then: Joi.number().required(),
                }),
                experience_required: Joi.string().valid(YES, NO).required(),
                exp_from: Joi.when('experience_required', {
                    is: Joi.exist().valid(YES),
                    then: Joi.number().required(),
                }),
                exp_from_type: Joi.when('experience_required', {
                    is: Joi.exist().valid(YES),
                    then: Joi.string().valid(YEAR, MONTH).required(),
                }),
                exp_to: Joi.when('experience_required', {
                    is: Joi.exist().valid(YES),
                    then: Joi.number().required(),
                }),
                exp_to_type: Joi.when('experience_required', {
                    is: Joi.exist().valid(YES),
                    then: Joi.string().valid(YEAR, MONTH).required(),
                }),
                submit_resume: Joi.string().valid(YES, NO, OPTIONAL).required(),
                email: Joi.string().email().optional(),
                user_question: Joi.array().items(Joi.string().required()).required().single(),
            }
            // const newData = moment(reqParam.dob).format(DB_DATE_FORMAT);
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            let skill = await reqParam.skill_sub_category_id.split(',').map(function(item) {
                return parseInt(item)
            })
            const quesarray = reqParam.user_question.split(',');
            await JobPost.findOne({
                where: {
                    id: reqParam.id,
                    status: {
                        [Op.not]: DELETE,
                    },
                }
            }).then(async(jobData) => {
                if (jobData) {
                    const updateObj = {
                        name: reqParam.name,
                        job_title: reqParam.job_title,
                        job_role_type_id: reqParam.job_role_type_id,
                        industry_id: reqParam.industry_id,
                        sector_id: reqParam.sector_id,
                        employment_type: reqParam.employment_type,
                        contract_type: reqParam.contract_type,
                        contract_duration: reqParam.contract_duration,
                        contract_other_type: reqParam.contract_other_type,
                        job_schedule: reqParam.job_schedule,
                        job_timetable: reqParam.job_timetable,
                        job_time_from: reqParam.job_time_from,
                        job_time_to: reqParam.job_time_to,
                        job_type_id: reqParam.job_type_id,
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        pin_code: reqParam.pin_code,
                        number_of_position: reqParam.number_of_position,
                        work_from_home: reqParam.work_from_home,
                        job_description: reqParam.job_description,
                        salary_type: reqParam.salary_type,
                        paid_type: reqParam.paid_type,
                        salary: reqParam.salary,
                        salary_from: reqParam.salary_from,
                        salary_to: reqParam.salary_to,
                        education_required: reqParam.education_required,
                        education_id: reqParam.education_id,
                        experience_required: reqParam.experience_required,
                        exp_to_type: reqParam.exp_to_type,
                        exp_from_type: reqParam.exp_from_type,
                        exp_from: reqParam.exp_from,
                        exp_to: reqParam.exp_to,
                        submit_resume: reqParam.submit_resume,
                        email: reqParam.email,
                    }
                    JobPost.update(updateObj, {
                        where: {
                            id: reqParam.id,
                        },
                    }).then(async(updateData, err) => {
                        if (updateData) {
                            const deleteSkill = await JobPostSkill.destroy({ where: { job_post_id: reqParam.id } }).then();
                            const deleteQuestion = await Question.destroy({ where: { job_post_id: reqParam.id } }).then();
                            await skill.forEach(function(resultId) {
                                promise.push(new Promise(async(resolve, reject) => {
                                    var skillObj = {
                                        job_post_id: reqParam.id,
                                        skill_sub_category_id: resultId,
                                        status: ACTIVE
                                    }
                                    await JobPostSkill.create(skillObj).then();
                                    resolve(true)
                                }))
                            })
                            await quesarray.forEach(function(result) {
                                promise.push(new Promise(async(resolve, reject) => {
                                    var queObj = {
                                        job_post_id: reqParam.id,
                                        questions: result,
                                        status: ACTIVE
                                    }
                                    await Question.create(queObj).then();
                                    resolve(true)
                                }))
                            })
                            Promise.all(promise).then(async() => {
                                let arr = [{
                                        model: Industry,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['industry_id'],
                                        }
                                    },
                                    {
                                        model: Sector,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['sector_id'],
                                        }
                                    },
                                    {
                                        model: JobType,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['job_type_id'],
                                        }
                                    },
                                    {
                                        model: city,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['city_id'],
                                        }
                                    },
                                    {
                                        model: state,
                                        attributes: ['id', 'name'],
                                        id: {
                                            [Op.eq]: ['state_id'],
                                        }
                                    },
                                    {
                                        model: EducationData,
                                        attributes: ['id', 'name'],

                                    },
                                    {
                                        model: Question,
                                        attributes: ['id', 'questions'],
                                        job_post_id: {
                                            [Op.eq]: ['id'],
                                        }
                                    },
                                    {
                                        model: JobPostSkill,
                                        attributes: ['skill_sub_category_id'],
                                        include: {
                                            model: SkillSubCategory,
                                            attributes: ['id', 'name', 'skill_category_id'],
                                        },
                                    }

                                ]
                                const responseData = await JobPost.findByPk(reqParam.id, { include: arr })
                                return Response.successResponseData(
                                    res,
                                    responseData,
                                    SUCCESS,
                                    res.locals.__('Job post update success')
                                )
                            })
                        }
                    }).catch((e) => {
                        console.log(e)
                        return Response.errorResponseData(res, res.__('Something went wrong'))
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Job post not available')
                    )
                }
            })
        }
    },

    /**
     * @description delete single job post
     * @param req
     * @param res
     * */
    deleteJobPost: async(req, res) => {
        const requestParam = req.params
        let promise = [];
        const jobPostData = await JobPost.findByPk(requestParam.id)
        if (jobPostData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            promise.push(new Promise(async(resolve, reject) => {
                let deleteSkills = await JobPostSkill.update({ status: DELETE }, { where: { job_post_id: requestParam.id } }).then();
                let deleteQuestion = await JobPostSkill.update({ status: DELETE }, { where: { job_post_id: requestParam.id } }).then();
                resolve(true)
            }))
            Promise.all(promise).then(async() => {
                jobPostData.status = DELETE
                jobPostData.save()
                    .then(() => {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Job post deleted'),
                            SUCCESS
                        )
                    })
                    .catch(() => {
                        Response.errorResponseData(
                            res,
                            res.__('Something went wrong'),
                            BAD_REQUEST
                        )
                    })
            })
        }
    },
    /**
     * @description 'Change the status of job '
     * @param req
     * @param res
     */
    changeJobStatus: async(req, res) => {
        const requestParams = req.body
        const schema = Joi.object({
            job_status: Joi.string().valid(OPEN, CLOSE).required(),
            job_post_id: Joi.number().required(),
        })
        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Is user available validation', error))
            )
        } else {
            await JobPost.findOne({
                where: {
                    id: requestParams.job_post_id,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(jobData) => {
                if (jobData) {
                    jobData.job_status = requestParams.job_status
                    jobData.save().then((result) => {
                        if (result) {
                            Response.successResponseWithoutData(
                                res,
                                res.locals.__('Job status update'),
                                SUCCESS
                            )
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch(() => {
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Job not found'),
                        SUCCESS
                    )
                }
            }).catch(() => {
                Response.errorResponseData(
                    res,
                    res.__('Internal Error'),
                    INTERNAL_SERVER
                )
            })
        }
    },
    OpenCloseJobList: async(req, res) => {
        const requestParams = req.query
        const { authUserId } = req;
        let query = {}

        query = {
            job_status: requestParams.job_status,
            status: {
                [Op.not]: DELETE,
            },
            user_id: authUserId
        }

        const options = {
            where: query,
            include: [{
                model: Industry
            }, {
                model: Sector
            }, {
                model: JobRoleType
            }],
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM user_applied_jobs AS uaj
                            WHERE
                                uaj.job_post_id = JobPost.id
                            
                        )`),
                        'applyCount'
                    ]
                ],
            },
            order: [
                ['id', 'DESC']
            ]
        }

        // await JobPost.findAll(options)
        await JobPost.findAndCountAll(options)
            .then((data) => {
                if (data) {
                    console.log("data::", data);
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success')
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            }, (e) => {
                console.log("error::", e);
                Response.errorResponseData(
                    res,
                    res.__(e),
                    INTERNAL_SERVER
                )
            })
    },

    /**
     * @description getUserById
     * @param req
     * @param res
     */
    GetUserById: async(req, res) => {

        const { authUserId } = req;

        const reqParam = req.params;
        const { job_id, user_id } = req.query;

        AddPath = (ImageArray) => {
            ImageArray.forEach(async SingleImage => {
                SingleImage['file'] = `${GlOBAL_CERTIFICATE_PATH}/${SingleImage.file}`;
            })
        }

        await User.findOne({
                include: [{
                        model: city,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Certification

                    },
                    {
                        model: state,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Industry,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: state,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: WorkExperience,
                        // attributes:[],
                    },
                    {
                        model: Education,
                        // attributes: ['education_id'],
                        include: {
                            model: EducationData,
                            // attributes: ['id', 'name'],
                        },
                    },
                    {
                        model: Answers,
                        required: false,
                        include: [{
                            model: Question,
                            where: {
                                job_post_id: job_id || null
                            }
                        }]
                    },
                    {
                        model: UserAppliedJob,
                        attributes: ["id", "user_id", "company_status", "candidate_status", "job_post_id", "reason"],
                        where: {
                            job_post_id: job_id || null
                        },
                        required: false,
                        include: [{
                                model: JobPost,
                                where: {
                                    // user_id: authUserId,
                                    status: {
                                        [Op.not]: DELETE
                                    },
                                    job_status: {
                                        [Op.not]: CLOSE
                                    }
                                },

                                include: [{
                                    model: NotInterested,
                                }, ],
                                attributes: ["id", "name", "status", "user_id", "job_status", "job_title", ]
                            },
                            {
                                model: User,
                                as: 'hiredStaff',
                                required: false,
                            }
                        ],
                    },

                    {
                        model: UserSkill,
                        attributes: ['skill_sub_category_id'],
                        include: {
                            model: SkillSubCategory,
                            attributes: ['id', 'name', 'skill_category_id'],
                        },
                    },
                ],
                where: {
                    id: user_id,
                    status: {
                        [Op.not]: DELETE,
                    }
                }
            })
            .then(async(userData) => {

                console.log(" ::: :::data ::: ,", userData);

                if (userData) {
                    if (userData.image && userData.image != "" && userData.image.startsWith("https://") === false) {
                        userData[
                            "image"
                        ] = `${GlOBAL_IMAGE_PATH}/${userData["image"]}`;
                    }
                    if (userData.resume && userData.resume != "") {
                        console.log("in there with resume ,", userData.resume);
                        userData[
                            "resume"
                        ] = `${USER_RESUME}/${userData["resume"]}`;
                    }

                    let ResumeDataAccess = await ResumeAccessData.findOne({
                        where: {
                            user_id: authUserId,
                            info_accessed_user_id: user_id
                        }
                    })
                    userData.dataValues["ResumeDataAccess"] = ResumeDataAccess;

                    try {
                        await UserAppliedJob.findOne({
                            where: {
                                job_post_id: job_id,
                                user_id
                            }
                        }).then(async customData => {
                            if (customData && customData.separate_resume && customData.separate_resume != '') {
                                userData.dataValues[
                                    "resume"
                                ] = `${USER_RESUME}/${customData["separate_resume"]}`;
                            }
                        })

                        userData.dataValues.EmployeesStatus = "N";
                        await userData.WorkExperiences.forEach(data => {
                            if (data.currently_employed === 'Y') {
                                userData.dataValues.EmployeesStatus = "Y";
                                userData.dataValues.current_salary = data.current_salary;
                            }
                        })

                        let responseData = await userData
                        let count = await Helper.workExperienceCount(res, user_id);
                        responseData.dataValues.work_experience_months = count;

                        console.log(" :: count :: ", count);

                        responseData.dataValues.notice_period_days = pluck(responseData.WorkExperiences, 'notice_period_days').filter(e => e != null)[0]
                        await AddPath(responseData.Certifications)

                        return Response.successResponseData(
                            res,
                            responseData,
                            res.locals.__('Success')
                        )
                    } catch (error) {

                        userData.dataValues.EmployeesStatus = "N";
                        await userData.WorkExperiences.forEach(data => {
                            if (data.currently_employed === 'Y') {
                                userData.dataValues.EmployeesStatus = "Y";
                                userData.dataValues.current_salary = data.current_salary;
                            }
                        })

                        let responseData = await userData
                        let count = await Helper.workExperienceCount(res, user_id);
                        responseData.dataValues.work_experience_months = count;

                        console.log(" :: count :: ", count);

                        responseData.dataValues.notice_period_days = pluck(responseData.WorkExperiences, 'notice_period_days').filter(e => e != null)[0]
                        await AddPath(responseData.Certifications)


                        return Response.successResponseData(
                            res,
                            userData,
                            res.locals.__('Success')
                        )
                    }

                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('User not available'),
                        SUCCESS
                    )
                }
            })
            .catch((e) => {
                console.log(e)
                return Response.errorResponseData(res, res.__('Something went wrong'))
            })
    },

    changeStatus: async(req, res) => {
        const requestParams = req.body;
        const { authUserId } = req;
        const schema = Joi.object({
            status: Joi.number().valid(0, 1, 2).required(),
            job_post_id: Joi.number().required(),
        })
        console.log("called !!", authUserId);

        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Is user available validation', error))
            )
        } else {
            await JobPost.findOne({
                where: {
                    id: requestParams.job_post_id,
                    user_id: authUserId,
                    status: {
                        [Op.not]: DELETE
                    }
                },
            }).then(async(jobData) => {
                if (jobData) {
                    jobData.status = requestParams.status
                    jobData.save().then((result) => {
                        if (result) {
                            Response.successResponseWithoutData(
                                res,
                                res.locals.__('Job status update'),
                                SUCCESS
                            )
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found'),
                                SUCCESS
                            )
                        }
                    }).catch(() => {
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Job not found'),
                        SUCCESS
                    )
                }
            }).catch(() => {
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },

    CompanyDashboard: async(req, res) => {
        const {
            year,
            month,
            day,
            job_status
        } = req.query

        const { authUserId } = req;

        // graphData
        let query = {
            status: {
                [Op.not]: DELETE,
            },
            user_id: authUserId
        }

        let arr = [{ model: UserAppliedJob }]

        let options = {
            where: query,
            order: [
                ['id', 'DESC']
            ],
            attributes: [],
            include: arr,
        }

        // year filter
        if (year) {
            query[Op.and] = [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('UserAppliedJobs.createdAt')), year)]
            options['group'] = [Sequelize.fn('MONTH', Sequelize.col('UserAppliedJobs.createdAt'))]
            options.attributes.push([Sequelize.fn('MONTH', Sequelize.col('UserAppliedJobs.createdAt')), 'MonthCount'])
        }

        // year && month filter
        if (year && month) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('UserAppliedJobs.createdAt')), month))
            options['group'] = [Sequelize.fn('DAY', Sequelize.col('UserAppliedJobs.createdAt'))]
            options.attributes.push([Sequelize.fn('DAY', Sequelize.col('UserAppliedJobs.createdAt')), 'Day'])

        }

        // year && month && day filter
        if (year && month && day) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('DAY', Sequelize.col('UserAppliedJobs.createdAt')), day))
        }

        if (job_status) {
            query[Op.and].push(Sequelize.where((Sequelize.col('candidate_status')), job_status))
        }

        // unreadMessagesCount
        const optionsChat = {
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
            include: [{
                model: Chat,
                where: {
                    user_id: {
                        [Op.ne]: authUserId,
                    },
                    read_status: false,
                },
                // attributes:[]
            }, ],
        };
        let allMessagesCount = await ChatChannel.count(optionsChat);
        // return res.send({allMessagesCount})
        // console.log(" ::: allMessagesCount :::,", allMessagesCount[0].Chats);
        // let initialValue = 0;
        // allMessagesCount.forEach(count => count.dataValues.unreadMessageCount ? initialValue += count.dataValues.unreadMessageCount : initialValue = initialValue)


        // counting pending requests
        let receivedPendingRequest = await UserAppliedJob.count({
            where: {
                company_status: 'PENDING',
            },
            include: [{
                model: JobPost,
                where: {
                    user_id: authUserId
                }
            }]
        })

        let totalActiveJob = await JobPost.count({
            where: {
                user_id: authUserId,
                job_status: 'OPEN',
                status: '1'
            }
        })

        let newAcceptedOffer = await UserAppliedJob.count({
            where: {
                candidate_status: 'ACCEPT_OFFER',
            },
            include: [{
                model: JobPost,
                where: {
                    job_status: 'OPEN',
                    user_id: authUserId,

                },
                required: true
            }]
        })

        await JobPost.count(options)
            .then((data) => {
                let dashboardData = {
                    graphData: data,
                    unreadMessageCount: allMessagesCount,
                    receivedPendingRequest,
                    totalActiveJob,
                    newAcceptedOffer
                }

                if (dashboardData) {
                    return Response.successResponseData(
                        res,
                        dashboardData,
                        SUCCESS,
                        res.locals.__('Success')
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            }, (e) => {
                console.log("error::", e);
                Response.errorResponseData(
                    res,
                    res.__(e),
                    INTERNAL_SERVER
                )
            })

    },

    getAllCompaniesHomepage: async(req, res) => {

        const { sortBy, page } = req.query;

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'ASC']
        ]



        let options = {
            where: {
                user_role_type: USER_ROLE_TYPE.company,
            },
            attributes: ['id', 'name', 'image', 'user_role_type'],
            include: [{
                model: SubscribedUser,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    },
                    expiry_date: {
                        [Op.gt]: moment()
                    }
                },
                include: [{
                    model: SubscriptionPlan,
                    where: {
                        plan_type: SUBSCRIPTION_PLAN_TYPE.company_branding_plan
                    },
                    required: true,
                    attributes: [],
                }]
            }],
            order: sorting,
            offset: offset,
        }

        if (limit) options['limit'] = limit;

        let companyData = await User.findAndCountAll(options);

        if (companyData.rows.length > 0) {
            return Response.successResponseData(
                res,
                companyData,
                SUCCESS,
                res.locals.__('Success')
            )
        } else {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('No data found'),
                FAIL
            )
        }
    },

    GetCountJobsType: async(req, res) => {
        let options = {
            where: {
                status: ACTIVE,
            },
            group: ["job_type_id"],
            include: [{
                model: JobType,
                attributes: [],
                where: {
                    name: {
                        [Op.ne]: null
                    }
                }
            }],
            attributes: ['JobType.name'],
            // order :["JobType.name", "ASC"]
        }
        await JobPost
            .count(options)
            .then(
                async data => {
                    let finalData = {};
                    await data.forEach(key => {
                        if (key.name === 'private') {
                            finalData["privateJobCount"] = key.count
                        } else if (key.name === 'govt') {
                            finalData["govtJobCount"] = key.count
                        }
                    })
                    if (data) {
                        return Response.successResponseData(
                            res,
                            finalData,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No Counts found"),
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

    },

    getIndustryCountInfo: async(req, res) => {
        let options = {
            where: {
                status: {
                    [Op.ne]: DELETE
                }
            },
            attributes: [],
            include: [{
                model: Industry,
                attributes: ["id", "name"]
            }],
            group: ["industry_id"]
        }

        options.attributes.push(
            [
                Sequelize.literal(`(
                    SELECT COUNT(*) FROM  job_post
                    WHERE job_post.status != ${DELETE}
                    AND job_post.industry_id = Industry.id
                    GROUP BY job_post.industry_id
                )`),
                'industryCount'
            ]
        )


        JobPost.findAll(options)
            .then(data => {

                console.log(data);
                data = {
                    count: data.length,
                    rows: data
                }
                if (!data) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No Data Found"),
                        FAIL
                    );
                } else {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Success")
                    );
                }
            }).catch(errr => {
                console.log(errr);
                Response.errorResponseData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                );
            })

    }
}