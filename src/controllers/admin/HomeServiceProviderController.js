const { User, UserRoles, state, city, rateServiceRequest, serviceCategoryJn, SubscribedUser, service, serviceRequest, User_otp, serviceProviderBranch, ServiceCategory, serviceDays, serviceDaysJn, ServiceImage } = require("../../models");
const { Op } = require("sequelize");
const Joi = require("@hapi/joi");
const bcrypt = require('bcrypt');
const {
    USER_ROLE_TYPE,
    DELETE
} = require('../../services/Constants')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path")

var fs = require('fs');
var excel = require('excel4node');

module.exports = {

    serviceProvider: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status,
            subscription_status,
            download_details
        } = req.query
        let limit = null;
        if (page) limit = 10;
        const roletype = USER_ROLE_TYPE.home_service_provider
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit

        let sorting = [
            ['id', 'DESC']
        ]

        const options = {
            where: {
                [Op.not]: [
                    { status: DELETE },
                ]
            },
            offset: offset,
            limit: limit,
            order: sorting,
            include: [{
                    model: UserRoles,
                    where: {
                        'roleType': roletype
                    },
                },
                {
                    model: city
                },
                {
                    model: state
                }

            ],
        };
        if (subscription_status == '0') {
            options['include'] = [...options['include'], {
                model: SubscribedUser,
                where: {
                    expiry_date: {
                        [Op.gt]: Date.now()
                    }
                }
            }]
        } else if (subscription_status == '1') {
            options['include'] = [...options['include'], {
                model: SubscribedUser,
                where: {
                    expiry_date: {
                        [Op.lt]: Date.now()
                    }
                },
            }]
        } else {
            options['include'] = [...options['include'], {
                model: SubscribedUser,
                where: {
                    expiry_date: {
                        [Op.gt]: Date.now()
                    }
                },
                required: false
            }]
        }
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        let subscriptionStatusfilter = subscription_status ? subscription_status : ''

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
        let str = '';
        for (const key in req.query) {
            str = str + `${key}=${req.query[key]}&`;
        }
        await User.findAndCountAll(options)
            .then((data) => {
                // return res.send(data.rows[0])
                if (data.count === 0) {
                    res.render('admin/serviceProvider/serviceProvider', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter,
                        subscriptionStatusfilter,
                        str
                    })
                } else {

                    if (download_details) {

                        //excel file config---
                        var workbook = new excel.Workbook();
                        var worksheet = workbook.addWorksheet('HomeServiceProvider');
                        var style = workbook.createStyle({
                            font: {
                                color: '#EA3A14',
                                size: 18
                            },
                            // numberFormat: '$#,##0.00; ($#,##0.00); -',
                            shrinkToFit: true,
                        });

                        var styleForData = workbook.createStyle({
                            font: {
                                color: '#47180E',
                                size: 12
                            },
                            alignment: {
                                wrapText: false,
                                horizontal: 'left',
                            },
                            shrinkToFit: true,
                            // numberFormat: '$#,##0.00; ($#,##0.00); -'
                        });

                        //Tab 1 headers
                        worksheet.cell(1, 1).string('S.No').style(style);
                        worksheet.cell(1, 2).string('id').style(style);
                        worksheet.cell(1, 3).string('Name').style(style);
                        worksheet.cell(1, 4).string('Email').style(style);
                        worksheet.cell(1, 5).string('Gender').style(style);
                        worksheet.cell(1, 6).string('DOB').style(style);
                        worksheet.cell(1, 7).string('State').style(style);
                        worksheet.cell(1, 8).string('City').style(style);
                        worksheet.cell(1, 9).string('Mobile').style(style);
                        worksheet.cell(1, 10).string('linkedIn Id').style(style);

                        //Some logic
                        function generateExcelSheetUser(array, worksheet) {
                            let row = 2; //Row starts from 2 as 1st row is for headers.
                            for (let i in array) {
                                let o = 1;
                                console.log(" :: array[i].id :: ", array[i].id);
                                //This depends on numbers of columns to fill.
                                worksheet.cell(row, o).number(o).style(styleForData);
                                worksheet.cell(row, o + 1).number(array[i].id).style(styleForData);
                                worksheet.cell(row, o + 2).string(array[i].name).style(styleForData);
                                worksheet.cell(row, o + 3).string(array[i].email).style(styleForData);
                                worksheet.cell(row, o + 4).string(array[i].gender).style(styleForData);
                                worksheet.cell(row, o + 5).string(array[i].dob).style(styleForData);
                                worksheet.cell(row, o + 6).string(array[i].state.name).style(styleForData);
                                worksheet.cell(row, o + 7).string(array[i].city.name).style(styleForData);
                                worksheet.cell(row, o + 8).string(array[i].mobile).style(styleForData);
                                worksheet.cell(row, o + 9).string(array[i].linkedIn_id).style(styleForData);
                                row = row + 1;
                            }
                        }
                        generateExcelSheetUser(data.rows, worksheet);
                        workbook.write('./excelSheet/Excel.xlsx')
                    }
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/serviceProvider/serviceProvider', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter,
                        subscriptionStatusfilter,
                        str
                    })
                }
            })
            .catch((e) => {
                console.log('114', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    serviceProviderDetails: async(req, res) => {
        const id = req.params.id
        const roleType = USER_ROLE_TYPE.home_service_provider

        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                ]
            })
            .then((alldata) => {
                res.render('admin/serviceProvider/serviceProviderDetail', { alldata, id, roleType, moment })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    createServiceProvider: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render("admin/serviceProvider/createServiceProvider", {
                    message,
                    error,
                    statedata,
                    formValue
                });
            })

    },

    addServiceProvider: async(req, res) => {

        const fields = req.files
        const reqParam = req.fields;
        let images;
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
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
                    'any.only': `'{{#label}} does not match`
                }),
            status: Joi.any().required()
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
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

            if (reqParam.mobile && reqParam.mobile !== '') {
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
                    return res.redirect(req.header('Referer'))
                }
                imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                await Helper.ImageUpload(req, res, imageName)

                let passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                // return;
                const userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    status: reqParam.status,
                    gender: reqParam.gender,
                    pin_code: reqParam.pin_code,
                    state_id: reqParam.state_id,
                    your_designation: reqParam.your_designation,
                    city_id: reqParam.city_id,
                    dob: reqParam.dob,
                    password: passwordHash,
                    image: imageName,
                    user_role_type: USER_ROLE_TYPE.home_service_provider,
                    referrer_code: referrer_code,
                }
                await User.create(userObj)
                    .then(async(result) => {

                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: USER_ROLE_TYPE.home_service_provider
                            });

                            const token = jwToken.issueUser({
                                id: result.id,
                                user_role_type: result.user_role_type,
                            })
                            result.reset_token = token
                            User.update({
                                reset_token: token
                            }, {
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
                                    await User_otp.create(updatedUser)
                                        .then(async(result) => {
                                                if (!result) {
                                                    req.flash('formValue', reqParam);
                                                    req.flash('error', 'Account is inactive');
                                                    return res.redirect(req.header('Referer'))
                                                } else {
                                                    const locals = {
                                                        username: result.name,
                                                        appName: Helper.AppName,
                                                        otp
                                                    };
                                                    try {
                                                        Mailer.sendMail(reqParam.email, 'Account Verification!', Helper.sendVerificationCode, locals);
                                                        req.flash('formValue', reqParam);
                                                        req.flash('success', 'Provider created successfully ');
                                                        res.redirect('/admin/service-provider')
                                                            // } else {
                                                            //     req.flash('formValue', reqParam);
                                                            //     req.flash('error', 'Internal Server Error. Try after sometime !');
                                                            //     res.redirect(req.header('Referer'))
                                                            // }
                                                    } catch (e) {
                                                        console.log('342', e)
                                                        req.flash('formValue', reqParam);
                                                        req.flash('error', 'Internal Server Error');
                                                        res.redirect(req.header('Referer'))
                                                    }
                                                }
                                                return null
                                            },
                                            (e) => {
                                                console.log('351', e)
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
                        console.log('364', e)
                        req.flash('formValue', reqParam);
                        req.flash('error', 'E-mail must be Unique');
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('370', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    verifyServiceProvider: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/EmailVerification/hsp_emailVerification", {
            message,
            error,
            formValue
        });
    },

    verify_ServiceProvider: async(req, res) => {
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
                    res.redirect('/admin/service-provider')


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

    editServiceProvider: async(req, res) => {
        const id = req.params.id;
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                ]
            })
            .then((alldata) => {
                state
                    .findAll({
                        include: [{
                            model: city,
                        }, ],
                    })
                    .then((statedata) => {
                        res.render("admin/serviceProvider/editServiceProvider", {
                            message,
                            error,
                            statedata,
                            alldata,
                            formValue,
                            moment
                        });
                    });
            })
            .catch((err) => {
                req.flash('alldata', reqParam);
                req.flash("error", err);
                res.redirect(req.header('Referer'))
            });


    },

    updateServiceProvider: async(req, res) => {
        const id = req.params.id
        const fields = req.files;
        const reqParam = req.fields;

        let images;

        const schema = Joi.object({
            name: Joi.string().trim().max(50).optional().allow(''),
            email: Joi.string().email().optional().allow(''),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).optional().allow('').alphanum(),
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
            gender: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            your_designation: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Designation" cannot be an empty field`,
                    'any.required': `"Designation" is a required field`
                }),
            dob: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"date of birth" cannot be an empty field`,
                    'any.required': `"date of birth" is a required field`
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
            status: Joi.any().optional().allow('')
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
        })
        const {
            error
        } = await schema.validate(reqParam)
        if (error) {

            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            console.log('609', id)
            User.findByPk(id)
                .then(async(imgdata) => {
                    // console.log('616', imgdata.image)
                    let img = imgdata.image;
                    if (imgdata && img) {
                        await Helper.RemoveImage(res, img)
                    }
                });

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
                your_designation: reqParam.your_designation,
                status: reqParam.status,
                gender: reqParam.gender,
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
                    req.flash('success', 'Service provider Updated sucessfully !');
                    res.redirect('/admin/service-provider')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    deleteServiceProvider: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id
        User.update({ status: '2' }, {
                where: {
                    id: id
                }
            })
            .then(async(data) => {
                req.flash("error", "Service provider Deleted sucessfully !");
                res.redirect('/admin/service-provider')
            })

        .catch((err) => {
            req.flash('error', 'Please check your network connection OR Email ALready Exists !');
            res.redirect(req.header('Referer'))
        })

    },

    getAllServices: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        const id = req.params.id
        let page = parseInt(req.query.page) || 1
        var {
            search,
            filter
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {},
            include: [{
                    model: ServiceCategory,
                },
                {
                    model: serviceDays,
                },
                {

                    model: serviceRequest
                },
                {
                    model: rateServiceRequest,
                    include: {
                        model: User
                    }
                }
            ],
            offset: offset,
            limit: limit,

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        let filterVal = filter ? filter : '';

        if (search) {
            options['where'] = {
                [Op.and]: [{

                    service_name: {
                        [Op.like]: `%${search}%`
                    },

                    service_provider_id: id
                }]
            }

        } else if (filter) {
            options['where'] = {
                [Op.and]: [

                    { service_status: filter },

                    { service_provider_id: id }
                ]
            }
        } else {
            options['where'] = {
                service_provider_id: id
            }
        }
        await service.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/serviceProvider/allServices', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        filterVal,
                        id,
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
                    res.render('admin/serviceProvider/allServices', {
                        data,
                        extra,
                        searchVal,
                        filterVal,
                        id,
                        pageNo,
                        limit,
                        message,
                        error
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })
    },
    getServiceById: async(req, res) => {

        const id = req.params.id;
        const serviceId = req.query.service_id;

        const options = {
            where: {
                id: serviceId
            },
            include: [{
                    model: ServiceImage,
                },
                {
                    model: ServiceCategory,
                },
                {
                    model: serviceDays,
                },
                {

                    model: serviceRequest
                },
                {
                    model: rateServiceRequest,
                    include: {
                        model: User
                    }
                }
            ]

        };
        await service.findOne(options)
            .then((data) => {
                console.log("chetan data finded");
                console.log(data);
                res.render('admin/serviceProvider/serviceDetails', {
                    data,
                    id,
                })
            })
            .catch((e) => {
                console.log("chetan error", e);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            })
    },

    getAllBranches: async(req, res) => {
        const id = req.params.id;
        console.log("console id");
        console.log(id);
        await serviceProviderBranch.findAll({
            where: {
                service_provider_id: id
            },
            include: [
                { model: state },
                { model: city },
            ]
        }).then(data => {
            console.log("console the data");
            console.log(data);
            return res.render('admin/serviceProvider/allBranches', {
                error: '',
                data,
                searchVal: '',
                filterVal: '',
                id,
                pageNo: 1,
                limit: 1,
                extra: '',
                message: ''
            })
        }).catch(error => {
            console.log("console error");
            console.log(error);
            return res.render('admin/serviceProvider/allBranches', {
                error: '',
                data: { rows: [] },
                searchVal: '',
                filterVal: '',
                id,
                pageNo: 1,
                limit: 1,
                extra: '',
                message: ''
            })
        })

    },

    addBranch: async(req, res) => {
        const id = req.query.provider_id;
        const stateData = await state.findAll();
        return res.render('admin/serviceProvider/addBranch', {
            stateData,
            id
        });
    },

    createBranch: async(req, res) => {
        const id = req.params.id;


        const requestParam = req.body;
        const reqObj = {
            shop_name: Joi.string().required(),
            address1: Joi.string().required(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            address2: Joi.string().optional(),
        };
        const schema = Joi.object(reqObj);
        const { error } = schema.validate(requestParam);
        if (error) {
            console.log(error);
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            if (requestParam.shop_name && requestParam.shop_name !== "") {
                const branchObj = {
                    service_provider_id: id,
                    shop_name: requestParam.shop_name,
                    address1: requestParam.address1,
                    pin_code: requestParam.pin_code,
                    state_id: requestParam.state_id,
                    city_id: requestParam.city_id,
                };
                await serviceProviderBranch
                    .create(branchObj)
                    .then(async result => {
                        req.flash('formValue', requestParam);
                        req.flash('success', 'Provider created successfully ');
                        res.redirect(`/admin/get-all-branches/${id}`)
                    })
                    .catch(e => {
                        console.log(e);
                        req.flash('formValue', e);
                        req.flash('error', 'please fill the field : ', e);
                        return res.redirect(req.header('Referer'))
                    });
            }
        }


    },

    deleteBranch: async(req, res) => {
        const id = req.params.id;
        await serviceProviderBranch.destroy({ where: { id } }).then((result) =>
            res.redirect(req.header('Referer'))
        ).catch((error) =>
            res.redirect(req.header('Referer'))
        )
    },

    addService: async(req, res) => {
        const id = req.query.provider_id;
        const category = await ServiceCategory.findAll();
        const days = await serviceDays.findAll();
        return res.render('admin/serviceProvider/addServices', {
            category,
            days,
            id
        });
    },

    deleteService: async(req, res) => {
        const id = req.params.id;

        const serviceId = req.query.service_id;
        await service
            .destroy({ where: { id: serviceId } })
            .then(async result => {
                res.redirect(`/admin/service-provider-all-services/${id}`);
            })
            .catch(e => {
                req.flash('error', e);
                res.redirect(req.header('Referer'));
            });
    },


    createService: async(req, res) => {
        const id = req.params.id;
        const files = req.files;
        const reqObj = {
            service_name: Joi.string().required(),
            service_charge: Joi.number().required(),
            service_categories: Joi.string().required(),
            days_available_1: Joi.string().optional(),
            days_available_2: Joi.string().optional(),
            days_available_3: Joi.string().optional(),
            days_available_4: Joi.string().optional(),
            days_available_5: Joi.string().optional(),
            days_available_6: Joi.string().optional(),
            days_available_7: Joi.string().optional(),
        };
        const schema = Joi.object(reqObj);
        const { error } = schema.validate(req.fields);
        if (error) {
            console.log(error);
            req.flash('error', error);
            res.redirect(req.header('Referer'));
        } else {
            if (req.fields.service_name && req.fields.service_name !== "") {
                const ServiceObj = {
                    service_provider_id: id,
                    service_name: req.fields.service_name,
                    service_charge: req.fields.service_charge,
                    service_status: 'YES',
                };
                await service
                    .create(ServiceObj)
                    .then(async result => {
                        if (req.fields.days_available_1) {
                            await serviceDaysJn.create({
                                day_id: 1,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_2) {
                            await serviceDaysJn.create({
                                day_id: 2,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_3) {
                            await serviceDaysJn.create({
                                day_id: 3,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_4) {
                            await serviceDaysJn.create({
                                day_id: 4,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_5) {
                            await serviceDaysJn.create({
                                day_id: 5,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_6) {
                            await serviceDaysJn.create({
                                day_id: 6,
                                service_id: result.id,
                            });
                        }
                        if (req.fields.days_available_7) {
                            await serviceDaysJn.create({
                                day_id: 7,
                                service_id: result.id,
                            });
                        }
                        let imageName;
                        let images;
                        console.log("chetan files.image");
                        console.log(files.photos);
                        if (files.photos) {
                            for (const Singleimage of files.photos) {
                                console.log("entered into fields.image ", Singleimage);
                                images = true;
                                const extension = Singleimage.type;
                                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                                if (files && Singleimage && (!imageExtArr.includes(extension))) {
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Image invalid');
                                    res.redirect(req.header('Referer'))
                                }
                                imageName = images ? `${Singleimage.name.split(".")[0]}${moment().unix()}${path.extname(Singleimage.name)}` : '';
                                Helper.AdminServiceImageUpload(Singleimage, res, imageName)
                                await ServiceImage.create({
                                    service_id: result.id,
                                    image: imageName
                                })
                            }
                        }
                        await serviceCategoryJn.create({
                            category_id: Number(req.fields.service_categories),
                            service_id: result.id,
                        });
                        res.redirect(`/admin/service-provider-all-services/${id}`);
                    })
                    .catch(e => {
                        console.log("chetan error", e)
                        req.flash('error', e);
                        req.flash('formValue', req.fields);
                        res.redirect(req.header('Referer'));
                    });
            }
        }



    },

    getRatings: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        const id = req.params.id
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: { service_id: id },
            offset: offset,
            limit: limit,
            include: {
                model: User,
            }
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';

        await rateServiceRequest.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/serviceProvider/allRatings', {
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

                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/serviceProvider/allRatings', {
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
                req.flash('error', 'Something went wrong !');
                res.redirect(req.header('Referer'))

            })
    },

    deleteReviewRating: async(req, res) => {
        const id = req.params.id
        const provider_id = req.query.provider_id
        rateServiceRequest.destroy({
                where: { id }
            }).then(async(data) => {
                req.flash("error", "Rating Removed Successfully");
                res.redirect(`/admin/view-ratings-reviews/${provider_id}`)
            })
            .catch((err) => {
                console.log("rating removed err");
                console.log(err);
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })

    },


    getRequests: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        const id = req.params.id
        let page = parseInt(req.query.page) || 1
        var {
            search,
            filter
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                service_id: id
            },
            include: [{
                    model: User,
                    where: {}
                }, {
                    model: service,
                    where: {}
                },
                {
                    model: serviceProviderBranch
                }
            ],
            offset: offset,
            limit: limit,

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        let filterVal = filter ? filter : '';

        if (search) {
            options.include['where'] = {

                service_name: {
                    [Op.like]: `%${search}%`
                },
            }
        } else if (filter) {
            options['where'] = {
                [Op.and]: [
                    { service_provider_status: filter },
                    { service_id: id }
                ]
            }
        }
        await serviceRequest.findAndCountAll(options)
            .then((data) => {
                //  return res.send(data)
                if (data.count === 0) {
                    res.render('admin/serviceProvider/serviceRequest', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        filterVal,
                        id,
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
                    console.log(":::::::::::::::::::data:::::::::::::::");

                    res.render('admin/serviceProvider/serviceRequest', {
                        data,
                        extra,
                        searchVal,
                        filterVal,
                        id,
                        pageNo,
                        limit,
                        message,
                        error
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                //  res.redirect(req.header('Referer'))
                res.send(e)
            })
    }
}