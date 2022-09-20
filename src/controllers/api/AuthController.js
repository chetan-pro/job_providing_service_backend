const bcrypt = require('bcrypt')
const Transformer = require('object-transformer')
const Constants = require('../../services/Constants')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require('path')
const Joi = require('@hapi/joi')
const jwToken = require('../../services/jwtToken')
const {
    DELETE,
    USER_IMAGE,
    SUCCESS,
    FAIL,
    ACTIVE,
    BAD_REQUEST,
    UNAUTHORIZED,
    INTERNAL_SERVER,
    UN_VERIFY,
    SIGN_UP_REDIRECTION,
    INACTIVE,
    USER_ROLE_TYPE
} = require('../../services/Constants')
const { User, UserReferral, User_otp, state, city, WalletTransactions, ReferalAmount, Role, UserRoles, Notification } = require('../../models')
const { Login } = require('../../transformers/api/UserTransformer')
module.exports = {
    /**
     * @description sign-up controller
     * @param req
     * @param res
     */
    signUp: async(req, res) => {
        const reqParam = req.body
        console.log("sign-up api called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            password: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            company_id: Joi.number().optional(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required(),
            confirm_password: Joi.any().valid(Joi.ref('password')).required(),
            referrer_code: Joi.string().optional(),
            user_role_type: Joi.string().valid(USER_ROLE_TYPE.candidate, USER_ROLE_TYPE.advisor, USER_ROLE_TYPE.staff, USER_ROLE_TYPE.business_correspondence,
                USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.company,
                USER_ROLE_TYPE.company_staff, USER_ROLE_TYPE.field_sales_executive,
                USER_ROLE_TYPE.home_service_provider, USER_ROLE_TYPE.home_service_seeker,
                USER_ROLE_TYPE.local_hunar).required(),
            linkedIn_id: Joi.string().optional(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Sign up', error))
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
                }).then((referrerCodeData) =>
                    referrerCodeData)

                if (!checkReferrerCode) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Referrer code not exits'),
                        FAIL
                    )
                }
            }

            try {
                const verifyToken = await Helper.generateMobileOtp(4, reqParam.mobile)
                const minutesLater = new Date()
                const verifyTokenExpire = minutesLater.setMinutes(
                    minutesLater.getMinutes() + 1440
                )
                const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = Helper.generateReferrerCode(reqParam.mobile);

                let userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    password: passwordHash,
                    status: ACTIVE,
                    otp: verifyToken,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    company_id: reqParam.company_id,
                    user_role_type: reqParam.user_role_type,
                    pin_code: reqParam.pin_code,
                    reset_expiry: verifyTokenExpire,
                    share_link: await Helper.createDynamicLink(referrer_code),
                    referrer_code: referrer_code,
                    linkedIn_id: reqParam.linkedIn_id
                }
                if (reqParam.user_role_type === "HSP") userObj["status"] = UN_VERIFY;
                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            await UserRoles.create({
                                userId: result.id,
                                roleType: reqParam.user_role_type.toUpperCase()
                            });
                            // save customer referral
                            if (reqParam.referrer_code && reqParam.referrer_code !== '') {
                                await UserReferral.create({
                                    user_id: result.id,
                                    ref_user_id: checkReferrerCode.id,
                                }).then(async(UserData) => {

                                    if (UserData) {
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
                                            if (UserData.user_role_type === USER_ROLE_TYPE.business_correspondence) {
                                                return Response.successResponseData(
                                                    res,
                                                    result,
                                                    SUCCESS,
                                                    res.locals.__('User added successfully')
                                                )
                                            }
                                            // let cashbackData = await ReferalAmount.findOne();
                                            // let currentWalletAmount = checkReferrerCode.wallet_money;

                                            if (updateData) {
                                                // referal cashback code start
                                                // await checkReferrerCode.update({
                                                //     wallet_money: currentWalletAmount + cashbackData.amount,
                                                // }).then(async function(data) {
                                                //     const walletData = {
                                                //         user_id: checkReferrerCode.id,
                                                //         previous_amount: currentWalletAmount,
                                                //         amount: cashbackData.amount,
                                                //         total_amount: currentWalletAmount + cashbackData.amount,
                                                //         type: Constants.WALLET_TYPE.credit,
                                                //         reason: 'Referal CashBack',
                                                //         details: 'Referal CashBack',
                                                //     }

                                                // await WalletTransactions.create(walletData).then(async() => {
                                                return Response.successResponseData(
                                                        res,
                                                        result,
                                                        SUCCESS,
                                                        res.locals.__('User added successfully')
                                                    )
                                                    // }).catch((e) => {
                                                    //     console.log(e);
                                                    //     return Response.errorResponseData(
                                                    //         res,
                                                    //         res.__('Something went wrong')
                                                    //     )
                                                    // });


                                                // }).catch((e) => {
                                                //     console.log(e);
                                                //     return Response.errorResponseData(
                                                //         res,
                                                //         res.__('Something went wrong')
                                                //     )
                                                // });
                                                // referal cashback code end


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
                                        // const meta = {token: jwToken.issueUser(user.id)}
                                        return Response.successResponseData(
                                            res,
                                            result,
                                            SUCCESS,
                                            res.locals.__('User added successfully')
                                        )

                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Something went wrong')
                                        )
                                    }
                                }, (e) => {
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

    signUpV2: async(req, res) => {
        const reqParam = req.fields;
        const reqFiles = req.files;
        console.log("reqParam :: ", reqParam);
        console.log("reqFiles :: ", reqFiles);
        console.log("sign-up api called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            password: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            company_id: Joi.number().optional(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required(),
            confirm_password: Joi.any().valid(Joi.ref('password')).required(),
            referrer_code: Joi.string().optional(),
            user_role_type: Joi.string().valid(USER_ROLE_TYPE.candidate, USER_ROLE_TYPE.advisor, USER_ROLE_TYPE.staff, USER_ROLE_TYPE.business_correspondence,
                USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.company,
                USER_ROLE_TYPE.company_staff, USER_ROLE_TYPE.field_sales_executive,
                USER_ROLE_TYPE.home_service_provider, USER_ROLE_TYPE.home_service_seeker,
                USER_ROLE_TYPE.local_hunar).required(),
            linkedIn_id: Joi.string().optional(),
        }

        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(error.details[0].message)
            )
        } else {

            if (!reqFiles.image) {
                return Response.validationErrorResponseData(
                    res,
                    res.__('Sign up validation image is required')
                )
            }

            if (reqParam.email && reqParam.email !== '') {
                const userEmailExist = await User.findOne({
                        where: {
                            email: reqParam.email,
                            status: {
                                [Op.not]: DELETE,
                            },
                        },
                    }).then((userEmailData) => userEmailData)
                    .catch(err => console.log("::err ::", err))

                if (userEmailExist) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Email address is already registered with us'),
                        FAIL
                    )
                }

                const DeletduserEmailExist = await User.findOne({
                    where: {
                        email: reqParam.email,
                        status: {
                            [Op.eq]: DELETE,
                        },
                    },
                }).then((userEmailData) => userEmailData)

                if (DeletduserEmailExist) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Email address is already registered with us, with deleted status'),
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
                }).then((referrerCodeData) =>
                    referrerCodeData)

                if (!checkReferrerCode || (checkReferrerCode.user_role_type === USER_ROLE_TYPE.field_sales_executive && reqParam.user_role_type === USER_ROLE_TYPE.business_correspondence) || (checkReferrerCode.user_role_type === USER_ROLE_TYPE.advisor && reqParam.user_role_type === USER_ROLE_TYPE.business_correspondence)) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Referrer code not exits'),
                        FAIL
                    )
                }
            }

            try {
                const verifyToken = await Helper.generateMobileOtp(4, reqParam.mobile)
                const minutesLater = new Date()
                const verifyTokenExpire = minutesLater.setMinutes(
                    minutesLater.getMinutes() + 1440
                )

                console.log(" :; log 419 :: ", " files :: ", reqFiles.image, " :: reqFiles.image.name :: ", reqFiles.image.name);

                let imageName;
                let images = true;
                const extension = reqFiles.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (reqFiles && reqFiles.image && (!imageExtArr.includes(extension))) {
                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }
                imageName = images ? `${reqFiles.image.name.split(".")[0]}${moment().unix()}${path.extname(reqFiles.image.name)}` : '';
                Helper.ImageUpload(req, res, imageName)


                console.log(" : imageName :: ", imageName);

                const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                let referrer_code = null;
                if (reqParam.user_role_type !== USER_ROLE_TYPE.business_correspondence) {
                    referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                }

                let userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    password: passwordHash,
                    status: UN_VERIFY,
                    otp: verifyToken,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    company_id: reqParam.company_id,
                    user_role_type: reqParam.user_role_type,
                    pin_code: reqParam.pin_code,
                    reset_expiry: verifyTokenExpire,
                    share_link: await Helper.createDynamicLink(referrer_code),
                    referrer_code: referrer_code,
                    linkedIn_id: reqParam.linkedIn_id,
                    image: imageName,
                    admin_approved: reqParam.user_role_type === USER_ROLE_TYPE.business_correspondence ? 0 : 1
                }

                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            await UserRoles.create({
                                userId: result.id,
                                roleType: reqParam.user_role_type.toUpperCase()
                            });
                            if (reqParam.referrer_code && reqParam.referrer_code !== '') {
                                await UserReferral.create({
                                    user_id: result.id,
                                    ref_user_id: checkReferrerCode.id,
                                }).then(async(UserData) => {
                                    if (UserData) {
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
                                            return Response.successResponseData(
                                                res,
                                                result,
                                                SUCCESS,
                                                res.locals.__('User added successfully')
                                            )

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
                                        // const meta = {token: jwToken.issueUser(user.id)}
                                        return Response.successResponseData(
                                            res,
                                            result,
                                            SUCCESS,
                                            res.locals.__('User added successfully')
                                        )

                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Something went wrong')
                                        )
                                    }
                                }, (e) => {
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
     * @description user login controller
     * @param req
     * @param res
     */
    login: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            username: Joi.string().required(), //[

            password: Joi.string().required()
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            console.log(error)
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Login validation', error))
            )
        } else {
            let user;
            let isMobile = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            if (reqParam.username.match(isMobile)) {
                console.log("enter in mobile")

                user = await User.findOne({
                    where: {
                        mobile: reqParam.username,
                        status: {
                            [Op.not]: DELETE,
                        },
                        is_staff_active: true
                    },
                }).then((customerData) => customerData)
            } else {
                user = await User.findOne({
                    where: {
                        email: reqParam.username,
                        status: {
                            [Op.not]: DELETE,
                        },
                        is_staff_active: true
                    },
                }).then((customerData) => customerData)
            }
            console.log(user)
            if (user) {
                //if (user.status === ACTIVE) {
                bcrypt.compare(
                        reqParam.password,
                        user.password,
                        async(err, result) => {
                            if (err) {
                                return Response.errorResponseWithoutData(
                                    res,
                                    res.locals.__('Email password not match'),
                                    BAD_REQUEST
                                )
                            }
                            if (result) {

                                const token = jwToken.issueUser({
                                    id: user.id,
                                    company_id: user.company_id,
                                    user_role_type: user.user_role_type,
                                })

                                console.log(result)
                                user.reset_token = token
                                User.update({ reset_token: token }, {
                                    where: {
                                        email: user.email
                                    }
                                }).then(async(updateData) => {
                                    if (updateData) {
                                        // const meta = {token: jwToken.issueUser(user.id)}
                                        console.log()
                                        return Response.successResponseData(
                                            res,
                                            new Transformer.Single(user, Login).parse(),
                                            SUCCESS,
                                            res.locals.__('Login success'),
                                        )

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
                            } else {
                                Response.errorResponseWithoutData(
                                    res,
                                    res.locals.__('Username password not match'),
                                    FAIL
                                )
                            }
                            return null
                        }
                    )
                    // } else {
                    //     Response.errorResponseWithoutData(
                    //         res,
                    //         res.locals.__('Account is inactive'),
                    //         UNAUTHORIZED
                    //     )
                    // }
            } else {
                Response.errorResponseWithoutData(
                    res,
                    res.locals.__('Username not exist'),
                    FAIL
                )
            }
        }
    },
    /**
     * @description admin forgot password controller
     * @param req
     * @param res
     */
    forgotPassword: async(req, res) => {
        const reqParam = req.body
        const schema = Joi.object({
            email: Joi.string().trim().email().max(150).required(),
        })
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Forgot password validation', error))
            )
        } else {
            User.findOne({
                where: {
                    email: reqParam.email.toLowerCase(),
                    status: {
                        [Op.ne]: DELETE,
                    },
                },
            }).then(
                async(user) => {
                    if (user) {
                        if (user.status === ACTIVE) {
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
                                user_id: user.id,
                            }

                            await User_otp.create(updatedUser).then(async(result) => {
                                    if (!result) {
                                        Response.errorResponseData(
                                            res,
                                            res.locals.__('Account is inactive'),
                                            BAD_REQUEST
                                        )
                                    } else {
                                        const locals = {
                                            username: user.name,
                                            appName: Helper.AppName,
                                            otp
                                        };
                                        try {
                                            console.log(":::checking:::");
                                            console.log(reqParam.email, 'Forgot Password!', Helper.forgotTemplate, locals);
                                            const mail = await Mailer.sendMail(reqParam.email, 'Forgot Password!', Helper.forgotTemplate, locals);
                                            if (mail) {
                                                return Response.successResponseWithoutData(res, res.locals.__('Forgot password email send success'), SUCCESS)
                                            } else {
                                                Response.errorResponseData(res, res.locals.__('Global error'), INTERNAL_SERVER);
                                            }
                                        } catch (e) {
                                            console.log(e)
                                            Response.errorResponseData(
                                                res,
                                                e.message,
                                                INTERNAL_SERVER
                                            )
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
                            Response.errorResponseData(
                                res,
                                res.locals.__('Account is inactive'),
                                UNAUTHORIZED
                            )
                        }
                    } else {
                        Response.errorResponseWithoutData(
                            res,
                            res.locals.__('Email not exist'),
                            FAIL
                        )
                    }
                },
                (e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                }
            )
        }
    },

    /**
     * @description Social Login
     * @param req
     * @param ress
     */
    socialLogin: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            user_role_type: Joi.string().optional(),
            social_login_type: Joi.number().required(),
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            social_login_id: Joi.string().required(),
            image: Joi.string().optional(),
        }

        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Login validation', error))
            )
        } else {
            console.log(reqParam.social_login_id)
            User.findOne({
                where: {
                    social_login_id: reqParam.social_login_id,
                    status: {
                        [Op.ne]: DELETE,
                    },
                },
            }).then(async(user) => {
                if (user) {
                    console.log(user)
                    const token = jwToken.issueUser({
                        id: user.id,
                        company_id: user.company_id,
                        user_role_type: user.user_role_type,
                    })
                    user.reset_token = token

                    if (user.social_login_id === reqParam.social_login_id) {
                        if (user.status === ACTIVE) {
                            User.update({ reset_token: token }, {
                                where: { social_login_id: reqParam.social_login_id },
                            }).then(async(updateData) => {
                                if (updateData) {
                                    // const meta = {token: jwToken.issueUser(user.id)}
                                    return Response.successResponseData(
                                        res,
                                        new Transformer.Single(user, Login).parse(),
                                        SUCCESS,
                                        res.locals.__('Login success'),
                                    )

                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__('Something went wrong')
                                    )
                                }
                            }, (e) => {
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            })
                        } else {
                            Response.errorResponseWithoutData(
                                res,
                                res.locals.__('Account is inactive'),
                                UNAUTHORIZED
                            )
                        }
                    } else {
                        const updateObj = {
                            social_login_id: reqParam.social_login_id,
                            social_login_type: reqParam.social_login_type,
                            reset_token: token,
                            //image: reqParam.image
                        }
                        User.update(updateObj, {
                            where: { social_login_id: reqParam.social_login_id },
                        }).then(async(updateData) => {
                            if (updateData) {
                                var data = {
                                    id: user.id,
                                    email: user.email,
                                    token: token
                                }
                                return Response.successResponseData(
                                    res,
                                    data,
                                    SUCCESS,
                                    res.locals.__('Login success')
                                )

                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }, (e) => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })

                    }
                } else {
                    console.log(user)
                        //start else
                    if (reqParam.email) {
                        let emailExistData = await User.findOne({
                            where: {
                                email: reqParam.email
                            }
                        })

                        if (emailExistData) {
                            return Response.errorResponseData(
                                res,
                                res.__('Email already Exist'),
                                FAIL
                            )
                        }
                    } else {
                        return Response.errorResponseData(
                            res,
                            res.__('No email address Found')
                        )
                    }

                    const reqObj = {
                        // user_role_type: reqParam.user_role_type,
                        email: reqParam.email,
                        name: reqParam.name,
                        image: reqParam.image,
                        status: ACTIVE,
                        social_login_id: reqParam.social_login_id,
                        social_login_type: reqParam.social_login_type,
                        referrer_code: Helper.generateReferrerCodeSocialLogin(),
                    }
                    await User.create(reqObj)
                        .then(async(result) => {
                            if (result) {
                                const token = jwToken.issueUser({
                                    id: result.id,
                                    company_id: result.company_id,
                                    user_role_type: result.user_role_type,
                                })
                                result.reset_token = token
                                User.update({ reset_token: token }, {
                                    where: { social_login_id: reqParam.social_login_id },
                                }).then(async(updateData) => {
                                    if (updateData) {
                                        // const meta = {token: jwToken.issueUser(user.id)}
                                        return Response.successResponseData(
                                            res,
                                            new Transformer.Single(result, Login).parse(),
                                            SUCCESS,
                                            res.locals.__('Login success'),
                                        )

                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Something went wrong')
                                        )
                                    }
                                }, (e) => {
                                    Response.errorResponseData(
                                        res,
                                        res.__('Internal error'),
                                        INTERNAL_SERVER
                                    )
                                })
                            }
                        })
                        .catch((e) => {
                            console.log("enter", e)
                            return Response.errorResponseData(
                                res,
                                res.__('Something went wrong')
                            )
                        })

                    //end else
                }
            }, (e) => {
                console.log("enter2", e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },

    /**
     * @description Reset password
     * @param req
     * @param res
     */
    resetPassword: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            email: Joi.string().email().required(),
            otp: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.any().valid(Joi.ref('password')).required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Reset password validation', error))
            )
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
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((userEmailData) => userEmailData)
                if (userEmailExist) {
                    const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                    await User.update({ password: passwordHash }, {
                        where: {
                            id: userEmailExist.id,
                            status: ACTIVE
                        },
                    }).then(async(result) => {
                        if (result) {

                            if (userEmailExist.user_role_type === 'CS') {

                                const locals = {
                                    username: userEmailExist.name,
                                    appName: Helper.AppName,
                                    otp: reqParam.otp,
                                    password: reqParam.password
                                };
                                let companyData = await User.findByPk(userEmailExist.company_id)
                                const mail = await Mailer.sendMail(companyData.email, 'Reset Password!', Helper.passwordChanged, locals);

                                let notification = {
                                    title: 'Reset Password!',
                                    message: 'Password Chnaged',
                                    body: {
                                        dets: userEmailExist,
                                        password: reqParam.password
                                    },
                                    notification_type: 'Alert',
                                    status: ACTIVE,
                                    user_id: companyData.id
                                }

                                console.log(" :: : companyData ::: ", companyData.fcm_token);

                                if (companyData.fcm_token != null || companyData.fcm_token != '') {
                                    console.log("inside fcm companyToken , ", companyData.fcm_token);
                                    Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            try {
                                                Helper.pushNotification(notification, companyData.fcm_token)
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

                            }



                            console.log(result)
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('Reset password success'),
                                SUCCESS
                            )
                        }
                    }).catch((e) => {
                        console.log(":::: errro :: ., ", e);
                        return Response.errorResponseData(
                            res,
                            res.__('Something went wrong')
                        )
                    })
                } else {
                    return Response.errorResponseData(
                        res,
                        res.__('Email does not exist')
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
        // })
    },

    // change password
    changePassword: async(req, res, next) => {

        const reqParam = req.body;
        const { authUserId } = req;
        console.log("authUserId : ", authUserId);
        const reqObj = {
            previous_password: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.string().required().valid(Joi.ref('password')).required(),
            user_role_type: Joi.string().required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return next(error);
        } else {
            let userData = await User.findByPk(authUserId);
            if (!userData) {
                return next("No User Found ");
            } else {
                console.log(reqParam.previous_password);
                console.log(userData.password);
                bcrypt.compare(
                    reqParam.previous_password,
                    userData.password,
                    async(err, result) => {
                        if (err) {
                            return next(err);
                        }
                        if (result) {
                            const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                            await userData.update({
                                password: passwordHash
                            });

                            if (userData.user_role_type === 'CS') {
                                const locals = {
                                    username: userData.name,
                                    appName: Helper.AppName,
                                    otp: '',
                                    password: reqParam.password
                                };
                                let companyData = await User.findByPk(userData.company_id)
                                const mail = await Mailer.sendMail(companyData.email, 'Reset Password!', Helper.passwordChanged, locals);
                                console.log(":::: mail sent ::  ", mail);

                                let notification = {
                                    title: 'Reset Password!',
                                    message: 'Password Changed',
                                    body: {
                                        dets: userData,
                                        password: reqParam.password
                                    },
                                    notification_type: 'Alert',
                                    status: ACTIVE,
                                    user_id: companyData.id
                                }

                                console.log(" :: : companyData ::: ", companyData.fcm_token);

                                if (companyData.fcm_token != null || companyData.fcm_token != '') {
                                    Notification.create(notification).then(async(result) => {
                                        if (result) {
                                            try {
                                                Helper.pushNotification(notification, companyData.fcm_token)
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
                            }

                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('Password updated successfully'),
                                SUCCESS,
                            );
                        } else {
                            return next("Please enter a correct password");
                        }
                    }
                )

                // res.json(userData);
            }
        }
    },

    /**
     * @description Social update link
     * @param req
     * @param res
     */
    UpdateCandidateSocialLink: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req
        let image;
        const requestObj = {
                name: Joi.string().trim().max(50).required(),
                email: Joi.string().email().required(),
                mobile: Joi.string()
                    .trim()
                    .min(10)
                    .max(10)
                    .regex(/^[0-9]*$/)
                    .required(),
                password: Joi.string().required(),
                image: Joi.string().optional(),
                state_id: Joi.number().required(),
                city_id: Joi.number().required(),
                pin_code: Joi.string().regex(/^[0-9]*$/).required(),
                confirm_password: Joi.any().valid(Joi.ref('password')).required(),
                referrer_code: Joi.string().optional(),
                user_role_type: Joi.string().valid(USER_ROLE_TYPE.candidate, USER_ROLE_TYPE.advisor, USER_ROLE_TYPE.business_correspondence,
                    USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.company,
                    USER_ROLE_TYPE.company_staff, USER_ROLE_TYPE.field_sales_executive,
                    USER_ROLE_TYPE.home_service_provider, USER_ROLE_TYPE.home_service_seeker,
                    USER_ROLE_TYPE.local_hunar).required(),
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
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        image: imageName ? reqParam.image : userData.image,
                        user_role_type: reqParam.user_role_type,
                        pin_code: reqParam.pin_code,
                    }

                    const token = jwToken.issueUser({
                        id: authUserId,
                        company_id: userData.company_id,
                        user_role_type: reqParam.user_role_type,
                    })

                    console.log(" :: updated user :: , ", token);

                    userData.reset_token = token;
                    await userData.save();

                    console.log(" userData :: ", userData);

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

                                await UserRoles.create({
                                    userId: authUserId,
                                    roleType: reqParam.user_role_type.toUpperCase()
                                });

                                return Response.successResponseData(
                                    res,
                                    //new Transformer.Single(responseData, edit_profile).parse(),
                                    responseData,
                                    SUCCESS,
                                    res.locals.__('User profile update success')
                                )
                            } else {
                                return Response.successResponseWithoutData(
                                    res,
                                    res.locals.__('User not available')
                                )
                            }
                        })
                        .catch((e) => {
                            console.log(e)
                            return Response.errorResponseData(res, res.__('Something went wrong'))
                        })
                }
            })
        }
    },

    changeUserRoleType: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req;
        const reqObj = {
            user_role_type: Joi.string().required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('user role validation', error))
            )
        } else {
            let roleData = await Role.findOne({ where: { role_type: reqParam.user_role_type } });

            const userFound = await User.findByPk(authUserId)
            userFound.user_role_type = reqParam.user_role_type.toUpperCase();
            userFound.save();

            console.log(roleData);

            if (!roleData) {
                return Response.errorResponseData(res, res.__('Invalid role type.'))
            }

            let userData = await User.findByPk(authUserId);
            let userRoleData = await UserRoles.findOne({
                where: {
                    userId: userData.id,
                    roleType: reqParam.user_role_type,
                }
            })

            if (!userRoleData) {
                await UserRoles.create({
                        userId: userData.id,
                        roleType: reqParam.user_role_type.toUpperCase()
                    })
                    .then(daya => console.log(daya))
                    .catch(err => console.log(" ::: eror ,", err))
            }

            userData.update({
                user_role_type: reqParam.user_role_type.toUpperCase()
            });

            return Response.successResponseWithoutData(
                res,
                res.locals.__('User role type updated successfully.'),
                SUCCESS
            )
        }
    }
}