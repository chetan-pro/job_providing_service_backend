const Joi = require("@hapi/joi");
const {
    Op
} = require("sequelize");
const bcrypt = require('bcrypt')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')


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

module.exports = {

    company: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const roletype = 'COMPANY'
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                [Op.not]: [
                    { status: [2] },
                ]
            },
            offset: offset,
            limit: limit,
            include: [{
                model: UserRoles,
                where: {
                    'roleType': roletype
                },
            }],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''

        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        await User.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/company/company', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company/company', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter
                    })
                }
            })
            .catch((e) => {
                console.log('114', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    createCompany: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render("admin/company/create_company", {
                    message,
                    error,
                    statedata,
                    formValue
                });
            })
    },

    create_company: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            name: Joi.string().trim().max(50).required().alphanum(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            company_link: Joi.string().required().uri().label('Company Link')
                .messages({
                    'string.empty': `"Company link" cannot be an empty field`,
                    'any.required': `"Company link" is a required field`,

                }),
            company_description: Joi.string().required()
                .messages({
                    'string.empty': `"Company Description" cannot be an empty field`,
                    'any.required': `"Company Description" is a required field`
                }),
            your_full_name: Joi.string().required()
                .messages({
                    'string.empty': `"Full Name" cannot be an empty field`,
                    'any.required': `"Full Name" is a required field`
                }),
            your_designation: Joi.string().required()
                .messages({
                    'string.empty': `"Designation" cannot be an empty field`,
                    'any.required': `"Designation" is a required field`
                }),
            address_line1: Joi.string().required()
                .messages({
                    'string.empty': `"Address Line 1" cannot be an empty field`,
                    'any.required': `"Address Line 1" is a required field`
                }),
            address_line2: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 2" cannot be an empty field`,
                    'any.required': `"Address Line 2" is a required field`
                }),
            image: Joi.string().optional().allow(''),
            referrer_code: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Referrer Code" cannot be an empty field`,
                    'any.required': `"Referrer Code" is a required field`
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
            password: Joi.string().required().min(6)
                .messages({
                    'string.min': `"Password" should have a minimum length of {#limit}`,
                }),
            confirm_password: Joi.any().valid(Joi.ref('password')).required()
                .messages({
                    'string.empty': `"Confirm Password" cannot be an empty field`,
                    'any.required': `"industry" is a required field`,
                    'any.only': `'{{#label}} does not match`
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
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Email address is already registered with us. Try with another Email !');
                    res.redirect(req.header('Referer'))
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
                req.flash('formValue', reqParam);
                req.flash('error', 'Mobile is already registered with us. Try with another mobile no. !');
                res.redirect(req.header('Referer'))
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
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Referrer code not exits !');
                    res.redirect(req.header('Referer'))
                }
            }

            try {
                const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                const userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    company_link: reqParam.company_link,
                    company_description: reqParam.company_description,
                    status: ACTIVE,
                    address_line1: reqParam.address_line1,
                    address_line2: reqParam.address_line2,
                    pin_code: reqParam.pin_code,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    your_full_name: reqParam.your_full_name,
                    your_designation: reqParam.your_designation,
                    password: passwordHash,
                    user_role_type: USER_ROLE_TYPE.company,
                    referrer_code: referrer_code,
                }
                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: USER_ROLE_TYPE.company
                            });

                            const token = jwToken.issueUser({
                                id: result.id,
                                user_role_type: result.user_role_type,
                            })
                            result.reset_token = token
                            User.update({ reset_token: token }, {
                                where: {
                                    email: result.email
                                }
                            }).then(async(updateData) => {
                                if (updateData) {
                                    const minutesLater = new Date()
                                    const restTokenExpire = minutesLater.setMinutes(
                                        minutesLater.getMinutes() + 20
                                    )
                                    const otp = await Helper.makeRandomNumber(6)
                                    const updatedUser = {
                                        otp: otp,
                                        otp_type: 1,
                                        otp_expiry: restTokenExpire,
                                        email: reqParam.email,
                                        user_id: result.id,
                                    }
                                    await User_otp.create(updatedUser).then(async(result) => {
                                            if (!result) {
                                                req.flash('formValue', reqParam);
                                                req.flash('error', 'Account is inactive');
                                                res.redirect(req.header('Referer'))
                                            } else {
                                                const locals = {
                                                    username: result.name,
                                                    appName: Helper.AppName,
                                                    otp
                                                };
                                                try {
                                                    const mail = await Mailer.sendMail(reqParam.email, 'Account Verification!', Helper.sendVerificationCode, locals);
                                                    if (mail) {
                                                        req.flash('formValue', reqParam);
                                                        req.flash('success', 'Account Verifcation email sent');
                                                        res.redirect('/admin/verify-company')

                                                    } else {
                                                        req.flash('formValue', reqParam);
                                                        req.flash('error', 'Internal Server Error. Try after sometime !');
                                                        res.redirect(req.header('Referer'))
                                                    }
                                                } catch (e) {
                                                    // console.log('306', e)
                                                    req.flash('formValue', reqParam);
                                                    req.flash('error', 'Internal Server Error');
                                                    res.redirect(req.header('Referer'))
                                                }
                                            }
                                            return null
                                        },
                                        (e) => {
                                            // console.log('314', e)
                                            req.flash('formValue', reqParam);
                                            req.flash('error', 'Internal Error');
                                            res.redirect(req.header('Referer'))
                                        })
                                } else {
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Something went wrong');
                                    res.redirect(req.header('Referer'))
                                }
                            })
                        }
                    }).catch((e) => {
                        // console.log(e)
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Something went wrong');
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                // console.log(e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    verify_company: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/EmailVerification/emailVerification", {
            message,
            error,
            formValue
        });
    },

    verifyOtp_company: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            email: Joi.string().email().required(),
            otp: Joi.string().required(),
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
            const isOtpExist = await User_otp.findOne({
                where: {
                    otp: reqParam.otp,
                    email: reqParam.email,
                    otp_expiry: {
                        [Op.gte]: moment()
                    }

                },
            }).then((isOtpExistData) => isOtpExistData)

            console.log("moment date :: ", moment().format(), ":::: otp time : ", isOtpExist);

            if (isOtpExist) {
                const userEmailExist = await User.findOne({
                    where: {
                        email: reqParam.email,
                    },
                }).then((userEmailData) => userEmailData)
                if (userEmailExist) {
                    const locals = {
                        username: userEmailExist.name,
                        appName: Helper.AppName,
                        otp: reqParam.otp,
                    };
                    const mail = await Mailer.sendMail(reqParam.email, 'Account Verification!', Helper.sendVerificationCode, locals);

                    req.flash('success', 'Company Created !');
                    res.redirect('/admin/company')


                } else {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Email does not exist');
                    res.redirect(req.header('Referer'))
                }
            } else {
                req.flash('formValue', reqParam);
                req.flash('error', 'Invalid otp');
                res.redirect(req.header('Referer'))
            }
        }
    },

    edit_company: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const statedata = await state.findAll()
        const id = req.params.id
        await User.findByPk(id, {
                include: [{
                        model: state
                    },
                    {
                        model: city
                    },
                ],
            })
            .then((alldata) => {

                res.render('admin/company/edit_company', {
                    alldata,
                    error,
                    message,
                    statedata,
                    id
                })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    update_company: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().trim().max(50).required().alphanum(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            company_link: Joi.string().required().uri().label('Company Link')
                .messages({
                    'string.empty': `"Company link" cannot be an empty field`,
                    'any.required': `"Company link" is a required field`,

                }),
            company_description: Joi.string().required()
                .messages({
                    'string.empty': `"Company Description" cannot be an empty field`,
                    'any.required': `"Company Description" is a required field`
                }),
            your_full_name: Joi.string().required()
                .messages({
                    'string.empty': `"Full Name" cannot be an empty field`,
                    'any.required': `"Full Name" is a required field`
                }),
            your_designation: Joi.string().required()
                .messages({
                    'string.empty': `"Designation" cannot be an empty field`,
                    'any.required': `"Designation" is a required field`
                }),
            address_line1: Joi.string().required()
                .messages({
                    'string.empty': `"Address Line 1" cannot be an empty field`,
                    'any.required': `"Address Line 1" is a required field`
                }),
            address_line2: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 2" cannot be an empty field`,
                    'any.required': `"Address Line 2" is a required field`
                }),
            image: Joi.string().optional().allow(''),
            referrer_code: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Referrer Code" cannot be an empty field`,
                    'any.required': `"Referrer Code" is a required field`
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
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            console.log('557', error)
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await User.update(data, {
                    where: {
                        id: id
                    }
                })
                .then((industriesdata) => {
                    req.flash('success', 'Company Updated sucessfully !');
                    res.redirect('/admin/company')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    company_delete: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }
        User.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Company Deleted sucessfully !');
                res.redirect('/admin/company')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    companyDetails: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id

        await User.findByPk(id)
            .then(async(alldata) => {
                const stateCity = await state.findByPk(alldata.state_id, {
                    include: [{
                        model: city,
                        where: {
                            id: alldata.city_id
                        }
                    }]
                })
                res.render('admin/company/companyDetail', {
                    alldata,
                    stateCity,
                    error,
                    message
                })
            })
            .catch((err) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            });
    },

    companyShowAllMessages: async(req, res) => {
        const {
            id
        } = req.params
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            sortBy
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ["id", sortBy != null ? sortBy : "ASC"]
        ];

        const options = {
            offset: offset,
            order: sorting,
            limit: limit,
            where: {
                [Op.or]: [{
                        sender_id: {
                            [Op.eq]: id,
                        },
                    },
                    {
                        receiver_id: {
                            [Op.eq]: id,
                        },
                    },
                ],
            },
            include: [{
                    model: User,
                    as: "senderInfo",
                },
                {
                    model: User,
                    as: "receiverInfo",
                },
                // {
                //     model: Chat,

                //     order: [
                //         ["id", "DESC"]
                //     ],
                // },
            ],

        };
        let searchVal = search ? search : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }

        if (limit) options["limit"] = limit;
        console.log('332', options)
        await ChatChannel.findAndCountAll(options)
            .then((data) => {

                // return res.send(data)

                if (data.count === 0) {
                    res.render('admin/company/company-contact', {
                        error: 'No data found !',
                        data,
                        searchVal,
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
                    console.log('356', extra)
                    res.render('admin/company/company-contact', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        id
                    })
                }

            })
            .catch((e) => {
                console.log(e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    companyShowMessages: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        var {
            chatChannel,
            userid,
            id
        } = req.query

        const options = {
            where: {
                [Op.or]: [{
                        sender_id: {
                            [Op.eq]: id,
                        },
                    },
                    {
                        receiver_id: {
                            [Op.eq]: id,
                        },
                    },
                ],
            },
            include: [{
                    model: User,
                    as: "senderInfo",
                },
                {
                    model: User,
                    as: "receiverInfo",
                },
                {
                    model: Chat,
                    order: [
                        ["id", "DESC"]
                    ],
                    where: {
                        [Op.or]: [{
                            chat_channel_id: {
                                [Op.eq]: chatChannel
                            },
                        }, ],
                    },
                },
            ],

        };

        await ChatChannel.findAndCountAll(options)
            .then((data) => {
                // console.log('730',data.rows.Chats)
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/company/company-message', {
                        error: 'No Chats found !',
                        data,
                        message: '',
                        id,
                        userid
                    })
                } else {
                    res.render('admin/company/company-message', {
                        data,
                        message,
                        id,
                        userid
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    companySubcriptions: async(req, res) => {
        const {
            id
        } = req.params
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            sortBy,
            status
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ["id", sortBy != null ? sortBy : "ASC"]
        ];

        const options = {
            offset: offset,
            order: sorting,
            limit: limit,
            where: {
                id: id
            },
            include: [{
                    model: SubscriptionPlan,
                },
                {
                    model: User,
                },
            ],

        };
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        if (limit) options["limit"] = limit;
        await SubscribedUser.findAndCountAll(options)
            .then((data) => {

                // return res.send(data)

                if (data.count === 0) {
                    res.render('admin/company/company-subcriptions', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        id,
                        statusfilter
                    })
                } else {
                    // return res.send(data)

                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    console.log('356', extra)
                    res.render('admin/company/company-subcriptions', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        id,
                        statusfilter
                    })
                }

            })
            .catch((e) => {
                console.log(e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

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

        res.render('admin/company/addJobPost', {
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

    createJobPost: async(req, res) => {
        const { id } = req.params
        const reqParam = req.body
            // console.log(reqParam)
        const reqObj = {
            name: Joi.string().trim().max(50).required().alphanum()
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
            job_type_id: Joi.string().required()
                .messages({
                    'string.empty': `"Job Type" cannot be an empty field`,
                    'any.required': `"Job Type" is a required field`
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
            job_timetable: Joi.string().optional(),
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
            salary: Joi.string().required()
                .messages({
                    'string.empty': `"salary" cannot be an empty field`,
                    'any.required': `"salary" is a required field`
                }),
            experience_required: Joi.string().required()
                .messages({
                    'string.empty': `"experience required" cannot be an empty field`,
                    'any.required': `"experience required" is a required field`
                }),
            salary_from: Joi.string().required()
                .messages({
                    'string.empty': `"salary from" cannot be an empty field`,
                    'any.required': `"salary from" is a required field`
                }),
            salary_to: Joi.string().required()
                .messages({
                    'string.empty': `"salary to" cannot be an empty field`,
                    'any.required': `"salary to" is a required field`
                }),
            exp_from: Joi.string().required()
                .messages({
                    'string.empty': `"exp from" cannot be an empty field`,
                    'any.required': `"exp from" is a required field`
                }),
            exp_from_type: Joi.string().required()
                .messages({
                    'string.empty': `"exp from type" cannot be an empty field`,
                    'any.required': `"exp from type" is a required field`
                }),
            exp_to_type: Joi.string().required()
                .messages({
                    'string.empty': `"exp to type" cannot be an empty field`,
                    'any.required': `"exp to type" is a required field`
                }),
            exp_to: Joi.string().required()
                .messages({
                    'string.empty': `"exp to" cannot be an empty field`,
                    'any.required': `"exp to" is a required field`
                }),
            education_required: Joi.string().required()
                .messages({
                    'string.empty': `"education required" cannot be an empty field`,
                    'any.required': `"education required" is a required field`
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
                        job_type_id: reqParam.job_type_id,
                        contract_other_type: reqParam.contract_other_type,
                        contract_duration: reqParam.contract_duration,
                        job_timetable: reqParam.job_timetable,
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
                        user_id: id
                    },
                })
                .then((jobPost) => {
                    let id = jobPost[0].id
                    const boolean = jobPost[1];
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
        console.log(id)
        const reqParam = req.body
        console.log(reqParam)
        const reqObj = {
            questions: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Question" cannot be an empty field`,
                    'any.required': `"Question" is a required field`,

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
            console.log(error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            // res.send(reqParam)
            Question
            // .bulkCreate([
            //     {job_post_id: id},
            //     {questions: reqParam.questions},
            //     {status: reqParam.status},
            // ])
                .findOrCreate({
                    where: {
                        job_post_id: id,
                        questions: reqParam.questions,
                        status: reqParam.status,
                    },
                })
                .then(async(ques) => {
                    // return res.send(ques)
                    let data = await JobPost.findByPk(ques[0].job_post_id)
                    console.log(data.user_id)
                    let id = data.user_id
                        // return res.send({data, ques})
                    req.flash('success', 'Job created successfully !');
                    res.redirect(`/admin/company/get-all-job-post/${id}`)
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
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            offset: offset,
            limit: limit,
            where: {
                user_id: reqParam,
                [Op.not]: [
                    { status: [2] },
                ]
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
            name: Joi.string().trim().max(50).required().alphanum()
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
            job_type_id: Joi.string().required()
                .messages({
                    'string.empty': `"Job Type" cannot be an empty field`,
                    'any.required': `"Job Type" is a required field`
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
            job_timetable: Joi.string().required()
                .messages({
                    'string.empty': `"Job Timetable" cannot be an empty field`,
                    'any.required': `"Job Timetable" is a required field`
                }),
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
            salary: Joi.string().required()
                .messages({
                    'string.empty': `"salary" cannot be an empty field`,
                    'any.required': `"salary" is a required field`
                }),
            experience_required: Joi.string().required()
                .messages({
                    'string.empty': `"experience required" cannot be an empty field`,
                    'any.required': `"experience required" is a required field`
                }),
            salary_from: Joi.string().required()
                .messages({
                    'string.empty': `"salary from" cannot be an empty field`,
                    'any.required': `"salary from" is a required field`
                }),
            salary_to: Joi.string().required()
                .messages({
                    'string.empty': `"salary to" cannot be an empty field`,
                    'any.required': `"salary to" is a required field`
                }),
            exp_from: Joi.string().required()
                .messages({
                    'string.empty': `"exp from" cannot be an empty field`,
                    'any.required': `"exp from" is a required field`
                }),
            exp_from_type: Joi.string().required()
                .messages({
                    'string.empty': `"exp from type" cannot be an empty field`,
                    'any.required': `"exp from type" is a required field`
                }),
            exp_to_type: Joi.string().required()
                .messages({
                    'string.empty': `"exp to type" cannot be an empty field`,
                    'any.required': `"exp to type" is a required field`
                }),
            exp_to: Joi.string().required()
                .messages({
                    'string.empty': `"exp to" cannot be an empty field`,
                    'any.required': `"exp to" is a required field`
                }),
            education_required: Joi.string().required()
                .messages({
                    'string.empty': `"education required" cannot be an empty field`,
                    'any.required': `"education required" is a required field`
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
            // res.send(reqParam)
            JobPost.update(reqParam, {
                    where: {
                        id: id
                    }
                })
                .then(async(jobPost) => {
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

    getPostDetails: async(req, res) => {
        const id = req.params.id

        await JobPost.findByPk(id)
            .then(async(alldata) => {
                console.log(alldata.id)
                const userID = alldata.user_id
                    // return res.send({alldata, userID})
                const industrySector = await Industry.findByPk(alldata.industry_id, {
                    include: [{
                        model: Sector,
                        where: {
                            id: alldata.sector_id
                        }
                    }]
                })
                res.render('admin/company/jobPostDetail', {
                    alldata,
                    industrySector,
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
        User.findByPk(id, {
                include: [{
                        model: state
                    },
                    {
                        model: city
                    }
                ],
            })
            .then(async(alldata) => {
                // return res.send(alldata)
                if (alldata.state_id === 0) {
                    let state = 'Nil'
                    let city = 'Nil'
                    res.render('admin/company/showUser', {
                        alldata,
                        city,
                        state
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    console.log('292', city)

                    res.render('admin/company/showUser', {
                        alldata,
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