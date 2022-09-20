const {
    Op
} = require("sequelize");
const {
    User,
    UserRoles,
    state,
    city,
    User_otp
} = require("../../models");
const bcrypt = require('bcrypt')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path");

const {
    USER_ROLE_TYPE,
    ACTIVE,
    DELETE,
} = require('../../services/Constants')
const Joi = require("@hapi/joi");



module.exports = {

    company_staff: async(req, res) => {
        const { id } = req.params
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status
        } = req.query;
        let limit = null;
        if (page) limit = 10;
        const roletype = USER_ROLE_TYPE.company_staff
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                roleType: roletype
            },
            offset: offset,
            limit: limit,
            include: [{
                model: User,
                where: {
                    company_id: id,
                    [Op.not]: [
                        { status: DELETE },
                    ]
                },
            }],
        };

        console.log(" :: options :: ", options);

        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options["include"][0]['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options["include"][0]['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        await UserRoles.findAndCountAll(options)
            .then((data) => {
                console.log(" :: dta : : ", data);
                if (data.count === 0) {
                    res.render('admin/company_staff/company_staff', {
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
                    console.log("staff all data");
                    console.log(data);
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/company_staff/company_staff', {
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
                console.log('101', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    createCompanyStaff: async(req, res) => {
        const { id } = req.params
        console.log('99', id)
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        await User.findOne({
            where: {
                id,

            },
            include: [{
                    model: state
                },
                {
                    model: city
                }
            ],
        }).then((userData) =>
            state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                console.log("userData.state.name");
                console.log(userData.state.name);
                res.render("admin/company_staff/create_company_staff", {
                    message,
                    userData,
                    error,
                    statedata,
                    formValue,
                    id
                });
            }))
    },

    create_CompanyStaff: async(req, res) => {
        const { id } = req.params
        const fields = req.files
        const reqParam = req.fields;
        let images;
        const reqObj = {
            name: Joi.string().trim().max(50).required()
                .messages({
                    'string.empty': `"Name" cannot be an empty field`,
                    'any.required': `"Name" is a required field`
                }),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            dob: Joi.string().required()
                .messages({
                    'string.empty': `"Date of Birth" cannot be an empty field`,
                    'any.required': `"Date of Birth" is a required field`
                }),
            gender: Joi.string().required()
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            address_line1: Joi.string().required()
                .messages({
                    'string.empty': `"Address Line 1" cannot be an empty field`,
                    'any.required': `"Address Line 1" is a required field`
                }),
            image: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Image" cannot be an empty field`,
                    'any.required': `"Image" is a required field`
                }),
            address_line2: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 2" cannot be an empty field`,
                    'any.required': `"Address Line 2" is a required field`
                }),
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
                    return res.redirect(req.header('Referer'))
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
                return res.redirect(req.header('Referer'))
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
                    return res.redirect(req.header('Referer'))
                }
            }

            try {
                let imageName;
                images = true;
                const extension = fields.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.image && (!imageExtArr.includes(extension))) {
                    // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    res.redirect(req.header('Referer'))
                }
                imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                await Helper.ImageUpload(req, res, imageName)
                const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                const userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    company_id: id,
                    dob: reqParam.dob,
                    gender: reqParam.gender,
                    status: reqParam.status,
                    address_line1: reqParam.address_line1,
                    address_line2: reqParam.address_line2,
                    pin_code: reqParam.pin_code,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    password: passwordHash,
                    user_role_type: 'CS',
                    referrer_code: referrer_code,
                    image: imageName,
                }
                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: 'CS'
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
                                                    // const mail = await Mailer.sendMail(reqParam.email, 'Account Verification!', Helper.sendVerificationCode, locals);
                                                    // if (mail) {
                                                    req.flash('formValue', reqParam);
                                                    req.flash('success', 'Staff created successfully');
                                                    res.redirect('/admin/company')

                                                    // } else {
                                                    // req.flash('formValue', reqParam);
                                                    // req.flash('error', 'Internal Server Error. Try after sometime !');
                                                    // res.redirect(req.header('Referer'))
                                                    // }
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
                        console.log(e)
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Something went wrong');
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log(e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    verify_company_staff: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/EmailVerification/cs_emailVerification", {
            message,
            error,
            formValue
        });
    },

    verifyOtp_company_staff: async(req, res) => {
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

                    req.flash('success', 'Company staff Created !');
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

    edit_companyStaff: async(req, res) => {
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

                if (alldata.state_id === 0) {

                    let state = 'Select state'
                    let city = 'Select city'
                    res.render('admin/company_staff/update_company_staff', {
                        alldata,
                        error,
                        message,
                        state,
                        city,
                        statedata,
                        id,
                        moment
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    console.log('391', state)
                    console.log('392', city)
                    res.render('admin/company_staff/update_company_staff', {
                        alldata,
                        error,
                        message,
                        state,
                        city,
                        statedata,
                        id,
                        moment
                    })
                }

            })
            .catch((e) => {
                console.log('468', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    update_companyStaff: async(req, res) => {
        const id = req.params.id
        const fields = req.files;
        const reqParam = req.fields;

        const schema = Joi.object({

            name: Joi.string().trim().max(50).optional().allow('')
                .messages({
                    'string.empty': `"Name" cannot be an empty field`,
                    'any.required': `"Name" is a required field`
                }),
            email: Joi.string().email().optional().allow('')
                .messages({
                    'string.empty': `"E-mail" cannot be an empty field`,
                    'any.required': `"E-mail" is a required field`
                }),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).optional().allow('')
                .messages({
                    'string.empty': `"Mobiile No." cannot be an empty field`,
                    'any.required': `"Mobiile No." is a required field`
                }),
            gender: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            image: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Image" cannot be an empty field`,
                    'any.required': `"Image" is a required field`
                }),
            dob: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Date Of Birth" cannot be an empty field`,
                    'any.required': `"Date Of Birth" is a required field`
                }),
            address_line1: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 1" cannot be an empty field`,
                    'any.required': `"Address Line 1" is a required field`
                }),
            address_line2: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 2" cannot be an empty field`,
                    'any.required': `"Address Line 2" is a required field`
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
        })
        const {
            error
        } = await schema.validate(reqParam)
        if (error) {
            console.log('468', error)
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            User.findByPk(id)
                .then(async(imgdata) => {
                    let img = imgdata.image
                    console.log(imgdata && img);
                    if (imgdata && img) {
                        console.log("testing error");
                        console.log(imgdata);
                        console.log(img);
                        await Helper.RemoveImage(res, img)
                    }
                })

            let imageName;
            images = true;
            const extension = fields.image.type;
            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
            if (fields && fields.image && (!imageExtArr.includes(extension))) {
                // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                req.flash('formValue', reqParam);
                req.flash('error', 'Image invalid');
                res.redirect(req.header('Referer'))
            }
            imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
            await Helper.ImageUpload(req, res, imageName)

            const userObj = {
                name: reqParam.name,
                email: reqParam.email,
                mobile: reqParam.mobile,
                dob: reqParam.dob,
                gender: reqParam.gender,
                status: reqParam.status,
                address_line1: reqParam.address_line1,
                address_line2: reqParam.address_line2,
                pin_code: reqParam.pin_code,
                state_id: reqParam.state_id,
                city_id: reqParam.city_id,
                image: imageName,
            }

            await User.update(userObj, {
                    where: {
                        id: id
                    }
                })
                .then(() => {
                    req.flash('success', 'company staff Updated sucessfully !');
                    res.redirect(req.header('Referer'))
                })
                .catch((error) => {
                    console.log('483', error)
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    companyStaff_delete: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }
        User.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'company staff Deleted sucessfully !');
                res.redirect('/admin/company')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    companyStaff_details: async(req, res) => {
        const id = req.params.id

        await User.findByPk(id, {
            include: [{
                    model: state
                },
                {
                    model: city
                }
            ],
        })

        .then(async(alldata) => {
                if (!alldata.state_id) {
                    let state = 'Nil'
                    let city = 'Nil'
                    res.render('admin/company_staff/company_staffDetail', {
                        alldata,
                        city,
                        state,
                        moment
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    res.render('admin/company_staff/company_staffDetail', {
                        alldata,
                        state,
                        city,
                        moment
                    })
                }
            })
            .catch((err) => {
                console.log(err)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

}