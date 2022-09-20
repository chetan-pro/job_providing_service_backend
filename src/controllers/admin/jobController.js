const Joi = require("@hapi/joi");
const {
    Op
} = require("sequelize");
const Sequelize = require("sequelize");
const bcrypt = require('bcrypt')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path");
const Constants = require("../../services/Constants");

const {
    USER_ROLE_TYPE,
    ACTIVE,
    DELETE,
} = require('../../services/Constants')
const {
    User,
    UserRoles,
    JobPost,
    Industry,
    Sector,
    UserAppliedJob,
    state,
    EducationData,
    city,
    JobType,
    ChatChannel,
    Question,
    Chat,
    JobRoleType,
    User_otp,
    SubscribedUser,
    SubscriptionPlan
} = require("../../models");
const { all } = require("../../routes/api/company");

module.exports = {

    // posts
    addJobPost: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id


        const jobRoleType = await JobRoleType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const company = await User.findOne({
            where: {
                id
            }
        })
        const education = await EducationData.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const jobType = await JobType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const industry = await Industry.findAll({
            include: [{
                model: Sector,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })
        const statedata = await state.findAll({
            include: [{
                model: city,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })

        let subscriptionData = await SubscribedUser.findAndCountAll({
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                        SELECT SubscribedUser.job_limit - COUNT(*) 
                        FROM job_post AS Job
                        Where
                        Job.subscription_plan_id = SubscribedUser.id
                        AND
                        SubscribedUser.job_limit != 0
                        AND
                        Job.user_id = ${id}
                    )`),
                        'AvailableJobLimits'
                    ],
                    [
                        Sequelize.literal(`(
                        SELECT SubscribedUser.email_limit - COUNT(*) 
                        FROM resume_access_data AS accessData
                        Where
                        accessData.email_downloaded = 'Y'
                        AND	
                        accessData.user_id = ${id}
                        AND
                        SubscribedUser.email_limit != 0
                        AND
                        accessData.user_subscribed_id = SubscribedUser.id
                    )`),
                        'AvailableEmailLimits'
                    ],
                    [
                        Sequelize.literal(`(
                        SELECT SubscribedUser.cv_limit - COUNT(*) 
                        FROM resume_access_data AS accessData
                        Where
                        accessData.cv_downloaded = 'Y'
                        AND	
                        accessData.user_id = ${id}
                        AND
                        SubscribedUser.cv_limit != 0
                        AND
                        accessData.user_subscribed_id = SubscribedUser.id
                    )`),
                        'AvailableCvlLimits'
                    ],
                ],
            },
            include: [{
                model: SubscriptionPlan,
                where: {
                    user_role_type: 'COMPANY',
                },
            }, ],

            where: {
                user_id: id,
                status: {
                    [Op.in]: [Constants.ACTIVE, Constants.INACTIVE]
                },
            },
        });

        if (subscriptionData.count == 0) {
            req.flash('error', 'This company does not have subscription ?');
            res.redirect(req.header('Referer'));
        }
        let description_limit = 100000;
        subscriptionData.rows.forEach((obj, index) => {
            console.log("obj.SubscriptionPlan.description_limit");
            console.log(obj.SubscriptionPlan.description_limit);
            console.log(obj.SubscriptionPlan.description_limit);
            if (obj.SubscriptionPlan.description_limit && description_limit === 100000) {
                console.log("setting description limint ", obj.SubscriptionPlan.description_limit);
                description_limit = obj.SubscriptionPlan.description_limit;
            }
        });

        console.log(description_limit);
        res.render('admin/company/addJobPost', {
            jobRoleType,
            industry,
            statedata,
            description_limit,
            jobType,
            education,
            companyName: company.name,
            error,
            message,
            formValue,
            id
        })
    },


    ShowaddJobGovtPost: async(req, res) => {


        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id

        const jobRoleType = await JobRoleType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const education = await EducationData.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const jobType = await JobType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const industry = await Industry.findAll({
            include: [{
                model: Sector,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })
        const statedata = await state.findAll({
            include: [{
                model: city,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })

        res.render('admin/company/addJobPostGovt', {
            jobRoleType,
            industry,
            statedata,
            jobType,
            education,
            error,
            message,
            formValue,
            id
        })
    },


    getAllGovtPost: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            job_status
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            offset: offset,
            limit: limit,
            where: {
                [Op.not]: [
                    { status: [2] },
                ],
                job_type_id: 2
            }
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (job_status) {
            options['where']['job_status'] = {
                [Op.like]: `%${job_status}%`
            }
        }
        await JobPost.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/company/getGovtPost', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        job_status
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company/getGovtPost', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message: '',
                        error: '',
                        job_status
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    createJobPost: async(req, res) => {
        const { id } = req.params
        const reqParam = req.body
            // console.log(reqParam)
        const reqObj = {
            name: Joi.string().trim().max(50).optional().allow('')
                .messages({
                    'string.empty': `"Job Name" cannot be an empty field`,
                    'any.required': `"Job Name" is a required field`,
                }),
            job_role_type_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Role Type" cannot be an empty field`,
                    'any.required': `"Job Role Type" is a required field`
                }),
            job_title: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Title" cannot be an empty field`,
                    'any.required': `"Job Title" is a required field`
                }),
            employment_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Employment Type" cannot be an empty field`,
                    'any.required': `"Employment Type" is a required field`
                }),
            industry_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"industry" cannot be an empty field`,
                    'any.required': `"industry" is a required field`
                }),
            sector_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Sector" cannot be an empty field`,
                    'any.required': `"Sector" is a required field`
                }),
            contract_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Type" cannot be an empty field`,
                    'any.required': `"Contract Type" is a required field`
                }),
            job_schedule: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Schedule" cannot be an empty field`,
                    'any.required': `"Job Schedule" is a required field`
                }),

            contract_other_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Other Type" cannot be an empty field`,
                    'any.required': `"Contract Other Type" is a required field`
                }),
            contract_duration: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Duration" cannot be an empty field`,
                    'any.required': `"Contract Duration" is a required field`
                }),
            // job_timetable: Joi.string().optional().allow('')
            //     .messages({
            //         'string.empty': `"Job Timetable" cannot be an empty field`,
            //         'any.required': `"Job Timetable" is a required field`
            //     }),
            job_time_from: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job time from" cannot be an empty field`,
                    'any.required': `"job time from" is a required field`
                }),
            job_time_to: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job time to" cannot be an empty field`,
                    'any.required': `"job time to" is a required field`
                }),
            work_from_home: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"work from home" cannot be an empty field`,
                    'any.required': `"work from home" is a required field`
                }),
            job_description: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job Description" cannot be an empty field`,
                    'any.required': `"job Description" is a required field`
                }),
            pin_code: Joi.string().regex(/^[0-9]*$/).optional().allow('')
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            state_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            number_of_position: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"number of position" cannot be an empty field`,
                    'any.required': `"number of position" is a required field`
                }),
            salary_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary Type" cannot be an empty field`,
                    'any.required': `"salary Type" is a required field`
                }),
            paid_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"paid type" cannot be an empty field`,
                    'any.required': `"paid type" is a required field`
                }),
            salary: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary" cannot be an empty field`,
                    'any.required': `"salary" is a required field`
                }),
            experience_required: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"experience required" cannot be an empty field`,
                    'any.required': `"experience required" is a required field`
                }),
            salary_from: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary from" cannot be an empty field`,
                    'any.required': `"salary from" is a required field`
                }),
            salary_to: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary to" cannot be an empty field`,
                    'any.required': `"salary to" is a required field`
                }),
            exp_from: Joi.string().optional().allow(''),
            exp_from_type: Joi.string().optional().allow(''),
            exp_to_type: Joi.string().optional().allow(''),
            exp_to: Joi.string().optional().allow(''),
            education_required: Joi.string().required()
                .messages({
                    'string.empty': `"education required" cannot be an empty field`,
                    'any.required': `"education required" is a required field`
                }),

            education_id: Joi.when('education_required', {
                    is: 'Y',
                    then: Joi.string().required(),
                })
                .messages({
                    'string.empty': `"education" cannot be an empty field`,
                    'any.required': `"education" is a required field`
                }),
            submit_resume: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"submit resume" cannot be an empty field`,
                    'any.required': `"submit resume" is a required field`
                }),
            job_status: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job status" cannot be an empty field`,
                    'any.required': `"job status" is a required field`
                }),
            email: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"email" cannot be an empty field`,
                    'any.required': `"email" is a required field`
                }),
            status: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"status" cannot be an empty field`,
                    'any.required': `"status" is a required field`
                }),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            // res.send(reqParam)
            JobPost.findOrCreate({
                    where: {
                        name: reqParam.name,
                        job_role_type_id: reqParam.job_role_type_id,
                        job_title: reqParam.job_title,
                        employment_type: reqParam.employment_type,
                        industry_id: reqParam.industry_id,
                        sector_id: reqParam.sector_id,
                        contract_type: reqParam.contract_type,
                        job_schedule: reqParam.job_schedule,
                        job_type_id: 1,
                        contract_other_type: reqParam.contract_other_type,
                        contract_duration: reqParam.contract_duration,
                        // job_timetable: reqParam.job_timetable,
                        job_time_from: reqParam.job_time_from,
                        job_time_to: reqParam.job_time_to,
                        work_from_home: reqParam.work_from_home,
                        job_description: reqParam.job_description,
                        pin_code: reqParam.pin_code,
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        number_of_position: reqParam.number_of_position,
                        salary_type: reqParam.salary_type,
                        paid_type: reqParam.paid_type,
                        salary: reqParam.salary,
                        experience_required: reqParam.experience_required,
                        education_id: reqParam.education_id,
                        salary_from: reqParam.salary_from ? reqParam.salary_from : null,
                        salary_to: reqParam.salary_to ? reqParam.salary_to : null,
                        exp_from: reqParam.exp_from ? reqParam.exp_from : null,
                        exp_from_type: reqParam.exp_from_type ? reqParam.exp_from_type : null,
                        exp_to_type: reqParam.exp_to_type ? reqParam.exp_to_type : null,
                        exp_to: reqParam.exp_to ? reqParam.exp_to : null,
                        education_required: reqParam.education_required,
                        submit_resume: reqParam.submit_resume,
                        job_status: reqParam.job_status,
                        email: reqParam.email,
                        status: reqParam.status,
                        user_id: id
                    },
                })
                .then((jobPost) => {
                    let id = jobPost[0].id
                    const boolean = jobPost[1];
                    console.log("::::::id:::::");
                    console.log(jobPost);
                    console.log(id);
                    console.log("::::::id:::::");
                    if (boolean) {
                        req.flash('formValue', reqParam);
                        req.flash('success', 'Job Post created sucessfully !');
                        res.redirect(`/admin/company/job-post/questions/${id}`)

                        // res.render('admin/company/ques', {postId,, message: 'Job Post created sucessfully !'})
                    } else {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Job Post Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    console.log(err)
                    req.flash('formValue', reqParam);
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });
        }
    },


    addJobGovtPost: async(req, res) => {

        // const {id} = req.params

        console.log(" :: into the controller :: ", req.body.name);

        const reqParam = req.fields;
        const files = req.files;
        const reqObj = {
            name: Joi.string().trim().max(50).optional().allow('')
                .messages({
                    'string.empty': `"Job Name" cannot be an empty field`,
                    'any.required': `"Job Name" is a required field`,

                }),
            job_role_type_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Role Type" cannot be an empty field`,
                    'any.required': `"Job Role Type" is a required field`
                }),
            job_title: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Title" cannot be an empty field`,
                    'any.required': `"Job Title" is a required field`
                }),
            employment_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Employment Type" cannot be an empty field`,
                    'any.required': `"Employment Type" is a required field`
                }),
            industry_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"industry" cannot be an empty field`,
                    'any.required': `"industry" is a required field`
                }),
            sector_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Sector" cannot be an empty field`,
                    'any.required': `"Sector" is a required field`
                }),
            contract_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Type" cannot be an empty field`,
                    'any.required': `"Contract Type" is a required field`
                }),
            job_schedule: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Job Schedule" cannot be an empty field`,
                    'any.required': `"Job Schedule" is a required field`
                }),
            contract_other_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Other Type" cannot be an empty field`,
                    'any.required': `"Contract Other Type" is a required field`
                }),
            contract_duration: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Duration" cannot be an empty field`,
                    'any.required': `"Contract Duration" is a required field`
                }),
            // job_timetable: Joi.string().optional().allow('')
            //     .messages({
            //         'string.empty': `"Job Timetable" cannot be an empty field`,
            //         'any.required': `"Job Timetable" is a required field`
            //     }),
            job_time_from: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job time from" cannot be an empty field`,
                    'any.required': `"job time from" is a required field`
                }),
            job_time_to: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job time to" cannot be an empty field`,
                    'any.required': `"job time to" is a required field`
                }),
            work_from_home: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"work from home" cannot be an empty field`,
                    'any.required': `"work from home" is a required field`
                }),
            job_description: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job Description" cannot be an empty field`,
                    'any.required': `"job Description" is a required field`
                }),
            pin_code: Joi.string().regex(/^[0-9]*$/).optional().allow('')
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            state_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            number_of_position: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"number of position" cannot be an empty field`,
                    'any.required': `"number of position" is a required field`
                }),
            salary_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary Type" cannot be an empty field`,
                    'any.required': `"salary Type" is a required field`
                }),
            paid_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"paid type" cannot be an empty field`,
                    'any.required': `"paid type" is a required field`
                }),
            salary: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary" cannot be an empty field`,
                    'any.required': `"salary" is a required field`
                }),
            experience_required: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"experience required" cannot be an empty field`,
                    'any.required': `"experience required" is a required field`
                }),
            salary_from: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary from" cannot be an empty field`,
                    'any.required': `"salary from" is a required field`
                }),
            salary_to: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"salary to" cannot be an empty field`,
                    'any.required': `"salary to" is a required field`
                }),
            exp_from: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"exp from" cannot be an empty field`,
                    'any.required': `"exp from" is a required field`
                }),
            exp_from_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"exp from type" cannot be an empty field`,
                    'any.required': `"exp from type" is a required field`
                }),
            exp_to_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"exp to type" cannot be an empty field`,
                    'any.required': `"exp to type" is a required field`
                }),
            exp_to: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"exp to" cannot be an empty field`,
                    'any.required': `"exp to" is a required field`
                }),
            education_required: Joi.string().required()
                .messages({
                    'string.empty': `"education required" cannot be an empty field`,
                    'any.required': `"education required" is a required field`
                }),

            education_id: Joi.when('education_required', {
                    is: 'Y',
                    then: Joi.string().required(),
                }).allow('')
                .messages({
                    'string.empty': `"education" cannot be an empty field`,
                    'any.required': `"education" is a required field`
                }),
            submit_resume: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"submit resume" cannot be an empty field`,
                    'any.required': `"submit resume" is a required field`
                }),
            job_status: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"job status" cannot be an empty field`,
                    'any.required': `"job status" is a required field`
                }),
            email: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"email" cannot be an empty field`,
                    'any.required': `"email" is a required field`
                }),

            deadline: Joi.string().required().allow('')
                .messages({
                    'string.empty': `"deadline" cannot be an empty field`,
                    'any.required': `"deadline" is a required field`
                }),
            organization: Joi.string().required().allow('')
                .messages({
                    'string.empty': `"organization" cannot be an empty field`,
                    'any.required': `"organization" is a required field`
                }),
            advertise_link: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"advertise_link" cannot be an empty field`,
                    'any.required': `"advertise_link" is a required field`
                }),
            official_website: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"official_website" cannot be an empty field`,
                    'any.required': `"official_website" is a required field`
                }),

            status: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"status" cannot be an empty field`,
                    'any.required': `"status" is a required field`
                }),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            let imageName;
            let images;
            if (files.image) {
                console.log("entered into fields.image ", files.image);
                images = true;
                const extension = files.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (files && files.image && (!imageExtArr.includes(extension))) {
                    // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    res.redirect(req.header('Referer'))
                }
                imageName = images ? `${files.image.name.split(".")[0]}${moment().unix()}${path.extname(files.image.name)}` : '';
                Helper.ImageUpload(req, res, imageName)
            }



            // res.send(reqParam)
            JobPost.findOrCreate({
                    where: {
                        name: reqParam.name,
                        job_role_type_id: reqParam.job_role_type_id,
                        job_title: reqParam.job_title,
                        employment_type: reqParam.employment_type,
                        industry_id: reqParam.industry_id,
                        sector_id: reqParam.sector_id,
                        contract_type: reqParam.contract_type,
                        job_schedule: reqParam.job_schedule,
                        job_type_id: 2,
                        contract_other_type: reqParam.contract_other_type,
                        contract_duration: reqParam.contract_duration ? reqParam.contract_duration : null,
                        // job_timetable: reqParam.job_timetable,
                        job_time_from: reqParam.job_time_from,
                        job_time_to: reqParam.job_time_to,
                        work_from_home: reqParam.work_from_home,
                        job_description: reqParam.job_description,
                        pin_code: reqParam.pin_code,
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        number_of_position: reqParam.number_of_position,
                        salary_type: reqParam.salary_type,
                        paid_type: reqParam.paid_type,
                        salary: reqParam.salary,
                        experience_required: reqParam.experience_required,
                        education_id: reqParam.education_id,
                        salary_from: reqParam.salary_from,
                        salary_to: reqParam.salary_to,
                        exp_from: reqParam.exp_from,
                        exp_from_type: reqParam.exp_from_type,
                        exp_to_type: reqParam.exp_to_type,
                        exp_to: reqParam.exp_to,
                        education_required: reqParam.education_required,
                        submit_resume: reqParam.submit_resume,
                        job_status: reqParam.job_status,
                        email: reqParam.email,
                        status: reqParam.status,
                        user_id: 1022,
                        subscription_plan_id: null,
                        deadline: reqParam.deadline,
                        organization: reqParam.organization,
                        advertise_link: reqParam.advertise_link,
                        official_website: reqParam.official_website,
                        image: imageName
                    },
                })
                .then((jobPost) => {
                    console.log(" :: 743 :: ", jobPost);
                    const boolean = true;
                    if (boolean) {
                        console.log(" :: 743 if :");
                        req.flash('formValue', reqParam);
                        req.flash('success', 'Job Post created sucessfully !');
                        res.redirect(`/admin/get-job-post-govt`)

                        // res.render('admin/company/ques', {postId,, message: 'Job Post created sucessfully !'})
                    } else {
                        console.log(" :: 743 if :");

                        req.flash('formValue', reqParam);
                        req.flash('error', 'Job Post Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    console.log(err)
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Something went wrong');
                    res.redirect(req.header('Referer'))
                });
        }
    },


    addQuesPage: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id
        console.log('chl gya', id)
        res.render('admin/company/ques', {
            error,
            message,
            formValue,
            id
        })
    },

    addQues: async(req, res) => {
        const id = req.params.id
        console.log(":::::reqParam:::::")
        console.log(id)
        const reqParam = req.body
        console.log(reqParam)
        console.log("reqParam")
        console.log(reqParam.questions.x)
        console.log(reqParam.status.x)

        const reqObj = {
            questions: Joi.required()
                .messages({
                    'string.empty': `"Question" cannot be an empty field`,
                    'any.required': `"Question" is a required field`,

                }),
            status: Joi.required()
                .messages({
                    'string.empty': `"status" cannot be an empty field`,
                    'any.required': `"status" is a required field`
                }),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            console.log(error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            var objArray = [];
            console.log("check all the erorr cause");
            if (typeof(reqParam.questions.x) === 'object') {
                reqParam.questions.x.forEach((obj, index) => {
                    console.log("check all the erorr cause");
                    console.log({ job_post_id: id, questions: reqParam.questions.x[index], status: reqParam.status.x[index] });
                    objArray.push({ job_post_id: id, questions: reqParam.questions.x[index], status: reqParam.status.x[index] });
                })
            } else {
                objArray = [{
                    job_post_id: id,
                    questions: reqParam.questions.x,
                    status: reqParam.status.x
                }]
            }
            console.log("checking the issue of erro");
            Question
                .bulkCreate([
                    ...objArray
                ])
                .then(async(ques) => {
                    console.log(ques);
                    let data = await JobPost.findByPk(id)
                    let userId = data.user_id
                        // return res.send({data, ques})
                    req.flash('success', 'Job created successfully !');
                    res.redirect(`/admin/company/get-all-job-post/${userId}`)
                })
                .catch((err) => {
                    console.log('1267', err)
                    req.flash('formValue', reqParam);
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });
        }
    },



    getAllPost: async(req, res) => {
        const reqParam = req.params.id
        console.log('895', reqParam)
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            job_status
        } = req.query
        let limit = null;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let options = {
            offset: offset,
            limit: limit,

        };
        if (reqParam) {
            options['where'] = {
                user_id: reqParam,
                [Op.not]: [
                    { status: [2] },
                ]
            }
        }
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (job_status) {
            options['where']['job_status'] = {
                [Op.like]: `%${job_status}%`
            }
        }
        await JobPost.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/company/getPost', {
                        reqParam,
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        job_status
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company/getPost', {
                        reqParam,
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message: '',
                        error: '',
                        job_status
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    editJob: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id

        const jobRoleType = await JobRoleType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const education = await EducationData.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const jobType = await JobType.findAll({
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            }
        })
        const industry = await Industry.findAll({
            include: [{
                model: Sector,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })
        const statedata = await state.findAll({
            include: [{
                model: city,
                where: {
                    [Op.not]: [
                        { status: [2] },
                    ]
                }
            }]
        })


        await JobPost.findByPk(id)
            .then(async(alldata) => {
                const jobRoleTypeVal = await JobRoleType.findByPk(alldata.job_role_type_id)
                const industryVal = await Industry.findByPk(alldata.industry_id)
                const sectorVal = await Sector.findByPk(alldata.sector_id)
                const educationDataVal = await EducationData.findByPk(alldata.education_id)
                const stateVal = await state.findByPk(alldata.state_id)
                const cityVal = await city.findByPk(alldata.city_id)
                const jobRoleTypeValue = jobRoleTypeVal ? jobRoleTypeVal : ''
                const sectorValue = sectorVal ? sectorVal : ''
                const educationDataValue = educationDataVal ? educationDataVal : ''
                const industryValue = industryVal ? industryVal : ''
                const stateValue = stateVal ? stateVal : ''
                const cityValue = cityVal ? cityVal : ''

                // return res.send({alldata, jobRoleTypeValue, industryValue,sectorValue,
                //     educationDataValue,stateVal, cityValue
                // })
                res.render('admin/company/editJobPost', {
                    jobRoleType,
                    industry,
                    statedata,
                    jobType,
                    education,
                    error,
                    message,
                    formValue,
                    jobRoleTypeValue,
                    industryValue,
                    sectorValue,
                    educationDataValue,
                    stateValue,
                    cityValue,
                    id,
                    alldata
                })
            })
            .catch((err) => {
                console.log(err.message)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    editJobPost: async(req, res) => {
        const { id } = req.params
        const reqParam = req.body
            // console.log(reqParam)
        const reqObj = {
            name: Joi.string().trim().max(50).required()
                .messages({
                    'string.empty': `"Job Name" cannot be an empty field`,
                    'any.required': `"Job Name" is a required field`,

                }),
            job_role_type_id: Joi.string().required()
                .messages({
                    'string.empty': `"Job Role Type" cannot be an empty field`,
                    'any.required': `"Job Role Type" is a required field`
                }),
            job_title: Joi.string().required()
                .messages({
                    'string.empty': `"Job Title" cannot be an empty field`,
                    'any.required': `"Job Title" is a required field`
                }),
            employment_type: Joi.string().required()
                .messages({
                    'string.empty': `"Employment Type" cannot be an empty field`,
                    'any.required': `"Employment Type" is a required field`
                }),
            industry_id: Joi.string().required()
                .messages({
                    'string.empty': `"industry" cannot be an empty field`,
                    'any.required': `"industry" is a required field`
                }),
            sector_id: Joi.string().required()
                .messages({
                    'string.empty': `"Sector" cannot be an empty field`,
                    'any.required': `"Sector" is a required field`
                }),
            contract_type: Joi.string().required()
                .messages({
                    'string.empty': `"Contract Type" cannot be an empty field`,
                    'any.required': `"Contract Type" is a required field`
                }),
            job_schedule: Joi.string().required()
                .messages({
                    'string.empty': `"Job Schedule" cannot be an empty field`,
                    'any.required': `"Job Schedule" is a required field`
                }),

            contract_other_type: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Contract Other Type" cannot be an empty field`,
                    'any.required': `"Contract Other Type" is a required field`
                }),
            contract_duration: Joi.string().required()
                .messages({
                    'string.empty': `"Contract Duration" cannot be an empty field`,
                    'any.required': `"Contract Duration" is a required field`
                }),
            // job_timetable: Joi.string().required()
            //     .messages({
            //         'string.empty': `"Job Timetable" cannot be an empty field`,
            //         'any.required': `"Job Timetable" is a required field`
            //     }),
            job_time_from: Joi.string().required()
                .messages({
                    'string.empty': `"job time from" cannot be an empty field`,
                    'any.required': `"job time from" is a required field`
                }),
            job_time_to: Joi.string().required()
                .messages({
                    'string.empty': `"job time to" cannot be an empty field`,
                    'any.required': `"job time to" is a required field`
                }),
            work_from_home: Joi.string().required()
                .messages({
                    'string.empty': `"work from home" cannot be an empty field`,
                    'any.required': `"work from home" is a required field`
                }),
            job_description: Joi.string().required()
                .messages({
                    'string.empty': `"job Description" cannot be an empty field`,
                    'any.required': `"job Description" is a required field`
                }),
            pin_code: Joi.string().regex(/^[0-9]*$/).required()
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            state_id: Joi.string().required()
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().required()
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            number_of_position: Joi.string().required()
                .messages({
                    'string.empty': `"number of position" cannot be an empty field`,
                    'any.required': `"number of position" is a required field`
                }),
            salary_type: Joi.string().required()
                .messages({
                    'string.empty': `"salary Type" cannot be an empty field`,
                    'any.required': `"salary Type" is a required field`
                }),
            paid_type: Joi.string().required()
                .messages({
                    'string.empty': `"paid type" cannot be an empty field`,
                    'any.required': `"paid type" is a required field`
                }),
            salary: Joi.when('salary_type', {
                    is: 'fixed_amount',
                    then: Joi.string().required(),
                })
                .messages({
                    'string.empty': `"salary" cannot be an empty field`,
                    'any.required': `"salary" is a required field`
                }),
            experience_required: Joi.string().required()
                .messages({
                    'string.empty': `"experience required" cannot be an empty field`,
                    'any.required': `"experience required" is a required field`
                }),
            salary_from: Joi.string().optional().allow(''),
            salary_to: Joi.string().optional().allow(''),
            exp_from: Joi.string().optional().allow(''),
            exp_from_type: Joi.string().optional().allow(''),
            exp_to_type: Joi.string().optional().allow(''),
            exp_to: Joi.string().optional().allow(''),
            education_required: Joi.string().required()
                .messages({
                    'string.empty': `"education required" cannot be an empty field`,
                    'any.required': `"education required" is a required field`
                }),

            education_id: Joi.when('education_required', {
                    is: 'Y',
                    then: Joi.string().required(),
                }).allow('')
                .messages({
                    'string.empty': `"education" cannot be an empty field`,
                    'any.required': `"education" is a required field`
                }),
            submit_resume: Joi.string().required()
                .messages({
                    'string.empty': `"submit resume" cannot be an empty field`,
                    'any.required': `"submit resume" is a required field`
                }),
            job_status: Joi.string().required()
                .messages({
                    'string.empty': `"job status" cannot be an empty field`,
                    'any.required': `"job status" is a required field`
                }),
            email: Joi.string().required()
                .messages({
                    'string.empty': `"email" cannot be an empty field`,
                    'any.required': `"email" is a required field`
                }),
            status: Joi.string().required()
                .messages({
                    'string.empty': `"status" cannot be an empty field`,
                    'any.required': `"status" is a required field`
                }),
        }


        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            reqParam['salary_from'] = reqParam.salary_from ? reqParam.salary_from : null;
            reqParam['salary_to'] = reqParam.salary_to ? reqParam.salary_to : null;
            reqParam['salary'] = reqParam.salary ? reqParam.salary : null;
            reqParam['exp_from'] = reqParam.exp_from ? reqParam.exp_from : null;
            reqParam['exp_from_type'] = reqParam.exp_from_type ? reqParam.exp_from_type : null;
            reqParam['exp_to_type'] = reqParam.exp_to_type ? reqParam.exp_to_type : null;
            reqParam['exp_to'] = reqParam.exp_to ? reqParam.exp_to : null;
            reqParam['education_id'] = reqParam.education_id ? reqParam.education_id : null;

            // res.send(reqParam)
            JobPost.update(reqParam, {
                    where: {
                        id: id
                    }
                })
                .then(async(jobber) => {
                    const job = await JobPost.findByPk(id)
                    console.log('1559', job.user_id)
                    req.flash('success', 'Job Post Updated sucessfully !');
                    res.redirect(`/admin/company/get-all-job-post/${job.user_id}`)
                })
                .catch((err) => {
                    console.log(err)
                    req.flash('formValue', reqParam);
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });
        }
    },

    deleteJob: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }
        JobPost.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Job Post Deleted sucessfully !');
                res.redirect(req.header('Referer'))
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    deleteJobQuestions: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }
        Question.destroy({
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Job Question Deleted sucessfully !');
                res.redirect(req.header('Referer'))
            })
            .catch((e) => {
                req.flash('error', 'Something went wrong !');
                res.redirect(req.header('Referer'))
            })
    },


    getPostDetails: async(req, res) => {
        const id = req.params.id
        await JobPost.findByPk(id, {
                include: [{
                        model: Industry
                    },
                    {
                        model: Sector
                    },
                    {
                        model: EducationData
                    },
                ],
            })
            .then(async(alldata) => {
                // return res.send(alldata.Industry)
                console.log("alldata")
                console.log(alldata)
                const userID = alldata.user_id

                res.render('admin/company/jobPostDetail', {
                    alldata,
                    userID
                })
            })
            .catch((err) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            });
    },

    getAppliedJobs: async(req, res) => {
        const reqParam = req.params.id
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            company_status
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                job_post_id: reqParam,
                [Op.not]: [
                    { status: [2] },
                ]
            },
            offset: offset,
            limit: limit,
            include: [{
                model: User,
            }],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (company_status) {
            options['where']['company_status'] = {
                [Op.like]: `%${company_status}%`
            }
        }
        await UserAppliedJob.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/company/getAppliedJobs', {
                        error: 'No data found !',
                        reqParam,
                        company_status,
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: ''
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company/getAppliedJobs', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        reqParam,
                        company_status
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    getShowUser: async(req, res) => {
        const id = req.params.id
        UserAppliedJob.findOne({
                where: {
                    user_id: id
                },
                include: [{
                    model: User,
                    include: [{
                            model: state
                        },
                        {
                            model: city
                        }
                    ],
                }],

            })
            .then(async(alldata) => {
                // return res.send(alldata)
                if (alldata.state_id === 0) {
                    let state = 'Nil'
                    let city = 'Nil'
                    res.render('admin/company/showUser', {
                        alldata,
                        moment,
                        city,
                        state
                    })
                } else {
                    let state = alldata.User.state.name
                    let city = alldata.User.city.name
                    console.log('292', city)

                    res.render('admin/company/showUser', {
                        alldata,
                        moment,
                        state,
                        city
                    })
                }
                // res.render('admin/company/showUser', {
                //     alldata,
                //     stateCity
                // })
            })
            .catch((err) => {

                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            });
    },

    // Q/A
    getAllQues: async(req, res) => {
        const id = req.params.id
        console.log(id)
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1

        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                job_post_id: id,
                [Op.not]: [
                    { status: [2] },
                ]
            },
            offset: offset,
            limit: limit,
        };
        if (limit) options['limit'] = limit;

        Question.findAndCountAll(options)
            .then((data) => {

                if (data.count === 0) {
                    // return res.send('no data found')
                    res.render('admin/company/getQues', {
                        error: 'No data found !',
                        data,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        id
                    })
                } else {
                    // return res.send(data)
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company/getQues', {
                        data,
                        extra,
                        pageNo,
                        limit,
                        id,
                        message,
                        error,
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    }
};