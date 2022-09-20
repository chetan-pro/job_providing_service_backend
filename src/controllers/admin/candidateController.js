const {
    Op,
    Sequelize
} = require("sequelize");
const {
    User,
    UserRoles,
    state,
    Question,
    city,
    JobPost,
    Industry,
    Sector,
    EducationData,
    Education,
    Answers,
    ChatChannel,
    UserAppliedJob,
    Chat,
    User_otp,
    SubscribedUser,
    SubscriptionPlan
} = require("../../models");
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
const Joi = require("@hapi/joi");
const { required } = require("@hapi/joi");



module.exports = {

    candidate: async(req, res) => {
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
            education_id,
            by_date
        } = req.query
        let limit = null;
        if (page) limit = 10;
        const roletype = USER_ROLE_TYPE.candidate
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]

        const options = {
            where: {
                [Op.not]: [{
                    status: [2]
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
                }
            ],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        let subscriptionStatusfilter = subscription_status ? subscription_status : ''
        let pinCode = pincode ? pincode : ''
        let stateId = state_id ? state_id : ''
        let educationId = education_id ? education_id : ''
        const statedata = await state.findAll({});
        const educationdata = await EducationData.findAll({});
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
        if (pincode) {
            options['where']['pin_code'] = {
                [Op.like]: `%${pinCode}%`
            }
        }
        if (educationId) {

            options['include'] = [...options['include'], {
                model: Education,
                where: {
                    education_id: educationId
                },
                include: [{ model: EducationData }]
            }]
        } else {
            options['include'] = [...options['include'], {
                model: Education,
                include: [{ model: EducationData, required: false }],
                required: false
            }]
        }

        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }

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
                required: false
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
            .then(async(data) => {
                if (data.count === 0) {
                    res.render('admin/candidate/candidate', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter,
                        subscriptionStatusfilter,
                        pinCode,
                        statedata,
                        stateId,
                        educationdata,
                        educationId,
                        str
                    })
                } else {

                    // res.send({data})

                    if (download_details) {

                        //excel file config---
                        var workbook = new excel.Workbook();
                        var worksheet = workbook.addWorksheet('Candidate');
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

                    res.render('admin/candidate/candidate', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter,
                        subscriptionStatusfilter,
                        pinCode,
                        statedata,
                        stateId,
                        educationdata,
                        educationId,
                        str
                    })
                }
            })
            .catch((e) => {
                console.log('101', e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    createCandidate: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render("admin/candidate/create_candidate", {
                    message,
                    error,
                    statedata,
                    formValue
                });
            })
    },

    create_candidate: async(req, res) => {

        const reqParam = req.fields;
        let resume;
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
            address_line2: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"Address Line 2" cannot be an empty field`,
                    'any.required': `"Address Line 2" is a required field`
                }),
            resume: Joi.any().optional(),
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
            console.log('209', error)
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

                resume = true;
                const extension = req.files.resume.type;
                const imageExtArr = [
                    "image/jpg",
                    "application/octet-stream",
                    "image/jpeg",
                    "image/png",
                    "application/pdf",
                ];
                if (req.files && req.files.resume && !imageExtArr.includes(extension)) {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    return res.redirect(req.header('Referer'))
                }
                let resumeName = resume ? `${req.files.resume.name.split(".")[0]}${moment().unix()}${path.extname(req.files.resume.name)}` : "";
                await Helper.ResumeUpload(req, res, resumeName)
                let passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);

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
                    password: passwordHash,
                    resume: resumeName,
                    user_role_type: USER_ROLE_TYPE.candidate,
                    referrer_code: referrer_code,
                }
                await User.create(userObj)
                    .then(async(result) => {

                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: USER_ROLE_TYPE.candidate
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
                                                            req.flash('success', 'Candidate created successfully');
                                                            return res.redirect('/admin/candidate')

                                                        } else {
                                                            req.flash('formValue', reqParam);
                                                            req.flash('error', 'Internal Server Error. Try after sometime !');
                                                            return res.redirect(req.header('Referer'))
                                                        }
                                                    } catch (e) {
                                                        console.log('361', e)
                                                        req.flash('formValue', reqParam);
                                                        req.flash('error', 'Internal Server Error');
                                                        return res.redirect(req.header('Referer'))
                                                    }
                                                }
                                                return null
                                            },
                                            (e) => {
                                                console.log('370', e)
                                                req.flash('formValue', reqParam);
                                                req.flash('error', 'Internal Error');
                                                return res.redirect(req.header('Referer'))
                                            })
                                } else {
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Something went wrong');
                                    return res.redirect(req.header('Referer'))
                                }
                            })
                        }
                    }).catch((e) => {
                        console.log('383', e)
                        req.flash('formValue', reqParam);
                        req.flash('error', 'E-mail must be Unique');
                        return res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('385', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                return res.redirect(req.header('Referer'))
            }
        }
    },

    verify_candidate: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/EmailVerification/candidate_emailVerification", {
            message,
            error,
            formValue
        });
    },

    verifyOtp_candidate: async(req, res) => {
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
            return res.redirect(req.header('Referer'))
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

                    req.flash('success', 'Candidate Created !');
                    return res.redirect('/admin/candidate')


                } else {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Email does not exist');
                    return res.redirect(req.header('Referer'))
                }
            } else {
                req.flash('formValue', reqParam);
                req.flash('error', 'Invalid otp');
                return res.redirect(req.header('Referer'))
            }
        }
    },

    edit_candidate: async(req, res) => {
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
                // return res.send(alldata)
                if (alldata.state_id === 0) {

                    let state = 'Select state'
                    let city = 'Select city'
                    res.render('admin/candidate/update_candidate', {
                        alldata,
                        error,
                        message,
                        statedata,
                        state,
                        city,
                        id,
                        moment
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    res.render('admin/candidate/update_candidate', {
                        alldata,
                        error,
                        message,
                        statedata,
                        state,
                        city,
                        id,
                        moment
                    })
                }

            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    update_candidate: async(req, res) => {
        const id = req.params.id
            // const reqParam = req.body;
        const reqParam = req.fields;
        console.log('518', reqParam)
        let resume;

        const schema = Joi.object({

            name: Joi.string().trim().max(50).required()
                .messages({
                    'string.empty': `"Name" cannot be an empty field`,
                    'any.required': `"Name" is a required field`
                }),
            email: Joi.string().email().required()
                .messages({
                    'string.empty': `"E-mail" cannot be an empty field`,
                    'any.required': `"E-mail" is a required field`
                }),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required()
                .messages({
                    'string.empty': `"Mobiile No." cannot be an empty field`,
                    'any.required': `"Mobiile No." is a required field`
                }),
            gender: Joi.string().required()
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            dob: Joi.string().required()
                .messages({
                    'string.empty': `"Date Of Birth" cannot be an empty field`,
                    'any.required': `"Date Of Birth" is a required field`
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
            status: Joi.any().required()
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
            resume: Joi.any().optional()
                .messages({
                    'string.empty': `"Resume cannot be an empty field`,
                }),
        })
        const {
            error
        } = await schema.validate(reqParam)
        if (error) {
            console.log('468', error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            console.log('591', id)
            User.findByPk(id)
                .then(async(resumedata) => {
                    console.log(resumedata);
                    resumedata.resume ? Helper.ResumeRemove(res, resumedata.resume) : '';
                }).catch((e) => console.log(e));

            let resumeName;
            if (req.files.resume && req.files.resume.size > 0) {
                resume = true;
                const extension = req.files.resume.type;
                const imageExtArr = [
                    "image/jpg",
                    "application/octet-stream",
                    "image/jpeg",
                    "image/png",
                    "application/pdf",
                ];
                if (req.files && req.files.resume && !imageExtArr.includes(extension)) {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'resume invalid');
                    return res.redirect(req.header('Referer'))
                }
                resumeName = resume ? `${req.files.resume.name.split(".")[0]}${moment().unix()}${path.extname(req.files.resume.name)}` : "";
                Helper.ResumeUpload(req, res, resumeName)
            }

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
                resume: resumeName,
                user_role_type: USER_ROLE_TYPE.candidate,
            }
            await User.update(userObj, {
                    where: {
                        id: id
                    }
                })
                .then(() => {
                    req.flash('success', 'candidate staff Updated sucessfully !');
                    return res.redirect('/admin/candidate')
                })
                .catch((error) => {
                    console.log('483', error)
                    req.flash('error', 'please check your network connection !');
                    return res.redirect(req.header('Referer'))
                })
        }

    },

    candidate_delete: async(req, res) => {

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
                req.flash('success', 'Candidate Deleted sucessfully !');
                return res.redirect('/admin/candidate')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    candidateDetails: async(req, res) => {
        const id = req.params.id

        await User.findByPk(id, {
                include: [{
                        model: state
                    },
                    {
                        model: city
                    },
                    {
                        model: Education,
                        include: [{ model: EducationData }]
                    }
                ],
            })
            .then((alldata) => {

                if (!alldata.state_id) {
                    let state = 'Nil'
                    let city = 'Nil'
                    res.render('admin/candidate/candidateDetail', {
                        alldata,
                        city,
                        state,
                        moment
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    res.render('admin/candidate/candidateDetail', {
                        alldata,
                        city,
                        state,
                        moment
                    })
                }
            })
            .catch((err) => {
                console.log(err)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    candidateShowAllMessages: async(req, res) => {
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
        console.log("::::::::::::::::::searchVal:::::::::::::::::::::");
        console.log(search);
        let searchVal = search ? search : ''
        if (search) {
            options['include'] = [{
                    model: User,
                    as: "senderInfo",
                    where: {
                        name: {
                            [Op.like]: `%${searchVal}%`
                        }
                    },
                    required: true
                },
                {
                    model: User,
                    as: "receiverInfo",
                    where: {
                        name: {
                            [Op.like]: `%${searchVal}%`
                        }
                    },
                    required: true
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
                    res.render('admin/candidate/candidate-contact', {
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
                    res.render('admin/candidate/candidate-contact', {
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
                console.log(":::::::::::::::::::::::::::::error:::::::::::::::::")
                console.log(e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    candidateShowMessages: async(req, res) => {
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
                    res.render('admin/candidate/candidate-message', {
                        error: 'No Chats found !',
                        data,
                        message: '',
                        id,
                        userid
                    })
                } else {
                    res.render('admin/candidate/candidate-message', {
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
                return res.redirect(req.header('Referer'))
            })
    },

    candidateSubcriptions: async(req, res) => {
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
            attributes: [],
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
        await User.findAndCountAll(options)
            .then((data) => {

                // return res.send({ dat: data.rows[0].SubscribedUsers })

                if (data.count === 0) {
                    res.render('admin/candidate/candidate-subcriptions', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        id,
                        str: '',
                        statusfilter,
                        moment,
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
                    res.render('admin/candidate/candidate-subcriptions', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        id,
                        statusfilter,
                        moment,
                        str: ''
                    })
                }

            })
            .catch((e) => {
                console.log(e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    getAppliedJobs: async(req, res) => {
        const reqParam = req.params.id
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,

        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                user_id: reqParam,
                [Op.not]: [{
                    status: [2]
                }, ]
            },
            offset: offset,
            limit: limit,
            include: [{
                model: JobPost
            }, ],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
            // if (search) {
            //     options['where']['name'] = {
            //         [Op.like]: `%${search}%`
            //     }
            // }

        await UserAppliedJob.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/candidate/getAppliedJobs', {
                        error: 'No data found !',
                        reqParam,
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
                    res.render('admin/candidate/getAppliedJobs', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        reqParam,
                    })
                }
            })
            .catch((e) => {
                console.log('961', e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    jobsDetails: async(req, res) => {
        const id = req.params.id

        await JobPost.findByPk(id)
            .then(async(alldata) => {
                // return res.send(alldata)
                const userID = alldata.user_id
                console.log('968', userID)
                    // return res.send({alldata, userID})
                const industrySector = await Industry.findByPk(alldata.industry_id, {
                    include: [{
                        model: Sector,
                        where: {
                            id: alldata.sector_id
                        }
                    }]
                })
                res.render('admin/candidate/jobPostDetail', {
                    alldata,
                    industrySector,
                    userID
                })
            })
            .catch((err) => {

                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            });
    },

    quesAns: async(req, res) => {
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
                [Op.not]: [{
                    status: DELETE
                }, ]
            },
            offset: offset,
            limit: limit,
            include: [{
                model: Answers
            }]
        };
        if (limit) options['limit'] = limit;

        Question.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    // return res.send('no data found')
                    res.render('admin/candidate/getQues', {
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
                    res.render('admin/candidate/getQues', {
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
                return res.redirect(req.header('Referer'))
            })
    },

    downoadExcel: (req, res) => {
        res.download('./excelSheet/Excel.xlsx');
    }

}