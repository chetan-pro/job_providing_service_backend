const Joi = require("@hapi/joi");
const {
    Op
} = require("sequelize");
const bcrypt = require('bcrypt')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path");


var fs = require('fs');
var excel = require('excel4node');

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
    SubscriptionPlan,
    resume_education,
    resume_experience,
    resume_skills,
    SkillSubCategory,
    resume_hobbies,
    resume_reference,
    resume,
    SkillCategory
} = require("../../models");

module.exports = {

    company: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status,
            subscription_status,
            download_details,
            pincode,
            state_id,
            city_id,
            industry_id,
            by_date
        } = req.query
        let limit = null;
        if (page) limit = 10;
        const roletype = USER_ROLE_TYPE.company
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                [Op.not]: [{
                    status: DELETE
                }, ]
            },
            offset: offset,
            order: sorting,
            limit: limit,
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
                },
                {
                    model: Industry
                },
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
                include: [{
                    model: SubscriptionPlan
                }]
            }]
        }
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        let subscriptionStatusfilter = subscription_status ? subscription_status : ''
        let pinCode = pincode ? pincode : '';
        let stateId = state_id ? state_id : '';
        let cityId = city_id ? city_id : '';
        let industryId = industry_id ? industry_id : '';
        const statedata = await state.findAll({});
        const industrydata = await Industry.findAll({});
        let byDate = by_date ? by_date : '';
        if (byDate) {
            options['where']['createdAt'] = {
                [Op.gt]: `%${byDate}%`
            }
        }
        if (stateId) {
            options['where']['state_id'] = {
                [Op.like]: `%${stateId}%`
            }
        }
        if (cityId) {
            options['where']['city_id'] = {
                [Op.like]: `%${cityId}%`
            }
        }
        if (industryId) {
            options['where']['industry_id'] = {
                [Op.like]: `%${industryId}%`
            }
        }
        if (pincode) {
            options['where']['pin_code'] = {
                [Op.like]: `%${pinCode}%`
            }
        }
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
                console.log("checking filter data");
                console.log({
                    error: 'No data found !',
                    data,
                    searchVal,
                    pageNo,
                    limit,
                    extra: '',
                    message: '',
                    statusfilter,
                    subscriptionStatusfilter,
                    statedata,
                    industrydata,
                    industryId,
                    stateId,
                    pinCode,
                    str
                });
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
                        statusfilter,
                        subscriptionStatusfilter,
                        statedata,
                        industrydata,
                        industryId,
                        stateId,
                        pinCode,
                        str
                    })
                } else {
                    if (download_details) {
                        //excel file config---
                        var workbook = new excel.Workbook();
                        var worksheet = workbook.addWorksheet('Company');
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
                        worksheet.cell(1, 11).string('Company link').style(style);
                        worksheet.cell(1, 12).string('Company Decription').style(style);
                        worksheet.cell(1, 13).string('Your Designation').style(style);



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
                                worksheet.cell(row, o + 10).string(array[i].company_link).style(styleForData);
                                worksheet.cell(row, o + 11).string(array[i].company_decription).style(styleForData);
                                worksheet.cell(row, o + 12).string(array[i].your_designation).style(styleForData);
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
                    res.render('admin/company/company', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter,
                        subscriptionStatusfilter,
                        statedata,
                        industrydata,
                        industryId,
                        stateId,
                        pinCode,
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

    createCompany: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const industrydata = await Industry.findAll({});
        state.findAll()
            .then((statedata) => {
                city.findAll({
                    where: {
                        state_id: formValue && formValue.state_id ? formValue.state_id : null
                    }
                }).then((citydata) => {
                    console.log("data of state and city model statedata");
                    console.log(statedata);
                    res.render("admin/company/create_company", {
                        message,
                        error,
                        statedata,
                        citydata,
                        industrydata,
                        formValue
                    });
                });
            });
    },

    create_company: async(req, res) => {

        const fields = req.files
        const reqParam = req.fields;
        let images;
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            company_link: Joi.string().required()
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
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
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
            industry_id: Joi.string().required()
                .messages({
                    'string.empty': `"Industry" cannot be an empty field`,
                    'any.required': `"Industry" is a required field`
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
                    res.redirect(req.header('Referer'))
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
                    res.redirect(req.header('Referer'))
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

                let passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                // return;
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
                    industry_id: reqParam.industry_id,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    your_full_name: reqParam.your_full_name,
                    your_designation: reqParam.your_designation,
                    password: passwordHash,
                    image: imageName,
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
                                                        req.flash('success', 'Account Created Successfully');
                                                        res.redirect('/admin/company')
                                                            // } else {
                                                            //     req.flash('formValue', reqParam);
                                                            //     req.flash('error', 'Internal Server Error. Try after sometime !');
                                                            //     res.redirect(req.header('Referer'))
                                                            // }
                                                    } catch (e) {
                                                        req.flash('formValue', reqParam);
                                                        req.flash('error', 'Internal Server Error');
                                                        res.redirect(req.header('Referer'))
                                                    }
                                                }
                                                return null
                                            },
                                            (e) => {
                                                // console.log('386', e)
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
                        // console.log('379', e)
                        req.flash('formValue', reqParam);
                        req.flash('error', 'E-mail must be Unique');
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                // console.log('385', e)
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
        const statedata = await state.findAll();
        const industrydata = await Industry.findAll({});


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
            .then(async(alldata) => {
                const citydata = await city.findAll({ where: { state_id: alldata.state_id } })
                res.render('admin/company/edit_company', {
                    alldata,
                    error,
                    industrydata,
                    message,
                    statedata,
                    citydata,
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
        const fields = req.files;
        const reqParam = req.fields;

        let images;

        const schema = Joi.object({
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            company_link: Joi.string().optional(),
            company_description: Joi.string().allow('').optional(),
            your_full_name: Joi.string().optional()
                .messages({
                    'string.empty': `"Full Name" cannot be an empty field`,
                    'any.required': `"Full Name" is a required field`
                }),
            your_designation: Joi.string().optional()
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
            industry_id: Joi.string().required()
                .messages({
                    'string.empty': `"Industry" cannot be an empty field`,
                    'any.required': `"Industry" is a required field`
                }).alphanum(),
            city_id: Joi.string().required()
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            status: Joi.any().required()
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
            let removeImageData;
            User.findByPk(id)
                .then(async(imgdata) => {
                    imgdata.image ? removeImageData = imgdata.image : removeImageData = '';
                })

            let imageName;
            if (fields.image && fields.image.size > 0) {
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
                Helper.ImageUpload(req, res, imageName)
            }

            if (removeImageData) Helper.RemoveImage(res, imgdata.image)

            const userObj = {
                name: reqParam.name,
                email: reqParam.email,
                mobile: reqParam.mobile,
                company_link: reqParam.company_link,
                company_description: reqParam.company_description,
                address_line1: reqParam.address_line1,
                address_line2: reqParam.address_line2,
                pin_code: reqParam.pin_code,
                state_id: reqParam.state_id,
                industry_id: reqParam.industry_id,
                city_id: reqParam.city_id,
                your_full_name: reqParam.your_full_name,
                your_designation: reqParam.your_designation,
                image: imageName,
            }

            await User.update(userObj, {
                    where: {
                        id: id
                    }
                })
                .then(() => {
                    req.flash('success', 'Company Updated sucessfully !');
                    res.redirect('/admin/company')
                })
                .catch((error) => {
                    console.log("error :; ", error)
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    company_delete: async(req, res) => {

        const id = req.params.id
        let data = {
            status: 2
        }
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
                        },
                    }, ]
                }, );
                console.log(alldata.industry_id);
                const industry = await Industry.findByPk(alldata.industry_id, );
                console.log("industry Data");
                console.log(industry);
                res.render('admin/company/companyDetail', {
                    alldata,
                    industry,
                    stateCity,
                    error,
                    message
                })
            })
            .catch((err) => {
                console.log("company details error");
                console.log(err);
                req.flash('error', 'Something went wrong');
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

            ],

        };
        let searchVal = search ? search : ''
        if (search) {
            options['include'][0][Op.or] = [{
                    model: User,
                    as: "senderInfo",
                    where: {
                        name: {
                            [Op.like]: `%${search}%`
                        }
                    }
                },
                {
                    model: User,
                    as: "receiverInfo",
                    where: {
                        name: {
                            [Op.like]: `%${search}%`
                        }
                    }
                },
                // [Op.like]: `%${search}%`
            ]
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

        let options = {
            offset: offset,
            order: sorting,
            limit: limit,
            where: {
                id: id
            },
            include: [{
                model: SubscribedUser,
                where: {},
                include: [{
                    model: SubscriptionPlan,
                }, ]
            }, ],

        };
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options['include'][0]['where']['title'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        if (limit) options["limit"] = limit;
        await User.findAndCountAll(options)
            .then((data) => {

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
                        statusfilter,
                        str: ''
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
                        statusfilter,
                        str: ''
                    })
                }

            })
            .catch((e) => {
                console.log('887', e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    // home-visiblity
    homeVisiblity: async(req, res) => {
        const id = req.params.id
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        console.log(id)

        await User.findByPk(id)
            .then((alldata) => {
                // res.send(alldata)
                res.render('admin/company/homePageVisible', {
                    alldata,
                    id,
                    error,
                    message,
                    formValue
                })
            })
            .catch((e) => {
                // console.log(e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            })
    },

    homePageVisiblity: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        await User.update(data, {
                where: {
                    id: id
                }
            })
            .then(() => {
                req.flash('success', 'Company Visibility changed sucessfully !');
                res.redirect('/admin/company')
            })
            .catch((error) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    showResumePage: async(req, res) => {


        const { download_details, pin_code, designation, experience, state_id, city_id, Skills_id } = req.query;
        console.log('chetan resume req.query', req.query);
        let str = '';
        for (const key in req.query) {
            str = str + `${key}=${req.query[key]}&`;
        }


        var arr = [{
                model: User
            },
            {
                model: resume_education,
                required: false,
            },
            {
                model: resume_experience,
                required: false,
            },
            {
                model: resume_skills,
                required: false,
                include: [{
                    model: SkillSubCategory,
                    where: {}
                }],
            },
            {
                model: resume_hobbies,
                required: false,

            },
            {
                model: resume_reference,
                required: false,
            },
            {
                model: city,
                attributes: ["id", "name"],
                required: false,
                where: {}

            },
            {
                model: state,
                attributes: ["id", "name"],
                required: false,
                where: {}
            },
        ];

        let resumeOptions = {
            include: arr,
            where: {}
        }

        pin_code ? resumeOptions['where']['pin_code'] = pin_code : '';
        designation ? resumeOptions['where']['designation'] = {
            [Op.like]: `%${designation}%`
        } : '';
        experience === '0' ? arr[2]['required'] = true : '';
        state_id ? resumeOptions['where']['state_id'] = state_id : '';
        city_id ? resumeOptions['where']['city_id'] = city_id : '';

        if (Skills_id) {
            arr[3]['include'][0]['where']['skill_category_id']
            arr[3]['required'] = true
        }

        let resumeData = await resume.findAndCountAll(resumeOptions)
        let countData = resumeData.rows.length;
        let Skills = await SkillCategory.findAll();
        let states = await state.findAll();
        let cities = await city.findAll();

        if (!resumeData) {
            res.render('admin/company/downloadResumes.ejs', {
                error: 'No data found',
                message: '',
                countData,
                Skills,
                states,
                cities,
                str,
                resumeData,
                pin_code,
                designation,
                experience,
                state_id,
                city_id,
                Skills_id
            })
        } else {

            if (download_details) {

                //excel file config---
                var workbook = new excel.Workbook();
                var worksheet = workbook.addWorksheet('Resumes');
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
                worksheet.cell(1, 3).string('name').style(style);
                worksheet.cell(1, 4).string('designation').style(style);
                worksheet.cell(1, 5).string('about').style(style);
                worksheet.cell(1, 6).string('description').style(style);
                worksheet.cell(1, 7).string('contact').style(style);
                worksheet.cell(1, 8).string('email').style(style);
                worksheet.cell(1, 9).string('address').style(style);
                worksheet.cell(1, 10).string('pin_code').style(style);
                worksheet.cell(1, 11).string('state').style(style);
                worksheet.cell(1, 12).string('city').style(style);
                worksheet.cell(1, 13).string('facebook').style(style);
                worksheet.cell(1, 14).string('twitter').style(style);
                worksheet.cell(1, 15).string('behance').style(style);
                worksheet.cell(1, 16).string('instagram').style(style);
                worksheet.cell(1, 17).string('linkedin').style(style);
                worksheet.cell(1, 18).string('portfolio').style(style);

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
                        worksheet.cell(row, o + 3).string(array[i].designation).style(styleForData);
                        worksheet.cell(row, o + 4).string(array[i].about).style(styleForData);
                        worksheet.cell(row, o + 5).string(array[i].description).style(styleForData);
                        worksheet.cell(row, o + 6).string(array[i].contact).style(styleForData);
                        worksheet.cell(row, o + 7).string(array[i].email).style(styleForData);
                        worksheet.cell(row, o + 8).string(array[i].address).style(styleForData);
                        worksheet.cell(row, o + 9).string(array[i].pin_code).style(styleForData);
                        worksheet.cell(row, o + 10).string(array[i].state.name).style(styleForData);
                        worksheet.cell(row, o + 11).string(array[i].city.name).style(styleForData);
                        worksheet.cell(row, o + 12).string(array[i].facebook).style(styleForData);
                        worksheet.cell(row, o + 13).string(array[i].twitter).style(styleForData);
                        worksheet.cell(row, o + 14).string(array[i].behance).style(styleForData);
                        worksheet.cell(row, o + 15).string(array[i].instagram).style(styleForData);
                        worksheet.cell(row, o + 16).string(array[i].linkedin).style(styleForData);
                        worksheet.cell(row, o + 17).string(array[i].portfolio).style(styleForData);
                        row = row + 1;
                    }
                }

                generateExcelSheetUser(resumeData.rows, worksheet);
                workbook.write('./excelSheet/Excel.xlsx')


            }

            res.render('admin/company/downloadResumes.ejs', {
                error: '',
                message: '',
                countData,
                Skills,
                states,
                cities,
                str,
                pin_code,
                designation,
                resumeData,
                experience,
                state_id,
                city_id,
                Skills_id
            })
        }

    }

};