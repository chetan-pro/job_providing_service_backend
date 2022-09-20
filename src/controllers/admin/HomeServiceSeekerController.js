const { Op } = require("sequelize");
const { User, UserRoles, state, city, serviceRequest, service, User_otp, serviceProviderBranch } = require("../../models");
const Joi = require("@hapi/joi");
const bcrypt = require('bcrypt');
const {
    USER_ROLE_TYPE,
    DELETE,
} = require('../../services/Constants')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path")
var fs = require('fs');
var excel = require('excel4node');

module.exports = {

    serviceSeeker: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status,
            download_details,
        } = req.query
        let limit = null;
        if (page) limit = 10;
        const roletype = USER_ROLE_TYPE.home_service_seeker
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
                    res.render('admin/serviceSeeker/serviceSeeker', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter,
                    })
                } else {

                    if (download_details) {
                        //excel file config---
                        var workbook = new excel.Workbook();
                        var worksheet = workbook.addWorksheet('HomeServiceSeeker');
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
                    res.render('admin/serviceSeeker/serviceSeeker', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter,
                    })
                }
            })
            .catch((e) => {
                console.log('114', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    serviceSeekerDetails: async(req, res) => {
        const id = req.params.id
        const roleType = USER_ROLE_TYPE.home_service_seeker

        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                ]
            })
            .then((alldata) => {
                res.render('admin/serviceSeeker/serviceSeekerDetail', { alldata, id, roleType, moment })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    createServiceSeeker: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render("admin/serviceSeeker/create_serviceSeeker", {
                    message,
                    error,
                    statedata,
                    formValue
                });
            })
    },

    addServiceSeeker: async(req, res) => {

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
            gender: Joi.string().required()
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            your_designation: Joi.string().required()
                .messages({
                    'string.empty': `"Designation" cannot be an empty field`,
                    'any.required': `"Designation" is a required field`
                }),
            dob: Joi.string().required()
                .messages({
                    'string.empty': `"Date of birth" cannot be an empty field`,
                    'any.required': `"Date of birth" is a required field`
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
                    dob: reqParam.dob,
                    pin_code: reqParam.pin_code,
                    state_id: reqParam.state_id,
                    your_designation: reqParam.your_designation,
                    city_id: reqParam.city_id,
                    password: passwordHash,
                    image: imageName,
                    user_role_type: USER_ROLE_TYPE.home_service_seeker,
                    referrer_code: referrer_code,
                }
                await User.create(userObj)
                    .then(async(result) => {

                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: USER_ROLE_TYPE.home_service_seeker
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
                                                        const mail = await Mailer.sendMail(reqParam.email, 'Account Verification!', Helper.sendVerificationCode, locals);
                                                        if (mail) {
                                                            req.flash('formValue', reqParam);
                                                            req.flash('success', 'Seeker created succesfully');
                                                            res.redirect('/admin/service-seeker')

                                                        } else {
                                                            req.flash('formValue', reqParam);
                                                            req.flash('error', 'Internal Server Error. Try after sometime !');
                                                            res.redirect(req.header('Referer'))
                                                        }
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

    verifyServiceSeeker: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/EmailVerification/hss_emailVerification", {
            message,
            error,
            formValue
        });
    },

    verify_ServiceSeeker: async(req, res) => {
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

                    req.flash('success', 'Service seeker Created !');
                    res.redirect('/admin/service-seeker')


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

    editServiceSeeker: async(req, res) => {

        const id = req.params.id;

        const error = req.flash("error");
        const message = req.flash("success");

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
                        res.render("admin/serviceSeeker/edit_serviceSeeker", {
                            message,
                            error,
                            statedata,
                            alldata,
                            moment
                        });
                    });
            })
            .catch((err) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            });
    },

    updateServiceSeeker: async(req, res) => {
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
                    'string.empty': `"Date of birth" cannot be an empty field`,
                    'any.required': `"Date of birth" is a required field`
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
                    let img = imgdata.image
                    await Helper.RemoveImage(res, img)
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
                your_designation: reqParam.your_designation,
                dob: reqParam.dob,
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
                    req.flash('success', 'Service seeker Updated sucessfully !');
                    res.redirect('/admin/service-seeker')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    deleteServiceSeeker: async(req, res) => {
        const id = req.params.id
        User.update({ status: '2' }, {
                where: {
                    id: id
                }
            })
            .then(async(data) => {
                req.flash("success", "Service Seeker Deleted sucessfully !");
                res.redirect(req.header('Referer'))
            })
            .catch((err) => {
                console.log(err)
                req.flash("error", error.details[0].message);
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
            where: {
                user_id: id
            },
            include: [{
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
                    { user_id: id }
                ]
            }
        }


        await serviceRequest.findAndCountAll(options)
            .then((data) => {
                //  return res.send(data)
                if (data.count === 0) {
                    res.render('admin/serviceSeeker/allServices', {
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
                    res.render('admin/serviceSeeker/allServices', {
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
    },

};