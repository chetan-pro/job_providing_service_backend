const {
    Op,
    Sequelize
} = require("sequelize");
const bcrypt = require('bcrypt')
const Joi = require('@hapi/joi')
const jwToken = require('../../services/jwtToken')
const moment = require('moment')

const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Mailer = require('../../services/Mailer')

const { admin, User_otp } = require("../../models");


module.exports = {

    login: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render('admin/auth/login', {
            message,
            error,
            formValue
        })
    },

    loginauth: async(req, res) => {
        const reqParam = req.body
        const reqObj = {
            username: Joi.string().required(),
            password: Joi.string().required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            let user;
            user = await admin.findOne({
                where: {
                    [Op.or]: [
                        { username: reqParam.username },
                        { email: reqParam.username }
                    ]
                }
            })
            if (user) {
                bcrypt.compare(
                    reqParam.password,
                    user.password,
                    async(err, result) => {
                        if (err) {
                            req.flash('formValue', reqParam);
                            req.flash('error', 'Email password not match');
                            return res.redirect(req.header('Referer'))
                        }
                        if (result) {
                            const token = jwToken.issueUser({
                                id: user.id,
                            })
                            user.reset_token = token
                            admin.update({ reset_token: token }, {
                                where: {
                                    email: user.email
                                }
                            }).then(async(updateData) => {
                                if (updateData) {
                                    // session store
                                    res.cookie('x-token', `Bearer ${token}`)
                                    return res.redirect('/admin/dashboard')
                                } else {
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Something went wrong');
                                    return res.redirect(req.header('Referer'))
                                }
                            }, (e) => {
                                req.flash('formValue', reqParam);
                                req.flash('error', 'Internal error');
                                return res.redirect(req.header('Referer'))
                            })
                        } else {
                            req.flash('formValue', reqParam);
                            req.flash('error', 'Username/e-mail password not match');
                            return res.redirect(req.header('Referer'))
                        }
                        return null
                    }
                )
            } else {
                req.flash('formValue', reqParam);
                req.flash('error', 'Username not exist');
                return res.redirect(req.header('Referer'))
            }
        }
    },

    forgotPassword: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render('admin/auth/forgot-password', {
            message,
            error,
            formValue
        })
    },

    forgotPasswordauth: async(req, res) => {
        const reqParam = req.body
        const schema = Joi.object({
            email: Joi.string().trim().email().max(150).required(),
        })
        const { error } = await schema.validate(reqParam)
        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            admin.findOne({
                where: {
                    email: reqParam.email.toLowerCase(),
                },
            }).then(
                async(user) => {
                    if (user) {
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
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Account is inactive');
                                    return res.redirect(req.header('Referer'))
                                } else {
                                    const locals = {
                                        username: user.name,
                                        appName: Helper.AppName,
                                        otp
                                    };
                                    try {
                                        const mail = await Mailer.sendMail(reqParam.email, 'Forgot Password!', Helper.forgotTemplate, locals);
                                        if (mail) {
                                            req.flash('formValue', reqParam);
                                            req.flash('success', 'Forgot password email sent');
                                            return res.redirect(req.header('Referer'))
                                        } else {
                                            req.flash('formValue', reqParam);
                                            req.flash('error', 'Internal Server Error. Try after sometime !');
                                            return res.redirect(req.header('Referer'))
                                        }
                                    } catch (e) {
                                        req.flash('formValue', reqParam);
                                        req.flash('error', 'Internal Server Error');
                                        return res.redirect(req.header('Referer'))
                                    }
                                }
                                return null
                            },
                            (e) => {
                                req.flash('formValue', reqParam);
                                req.flash('error', 'Internal Error');
                                return res.redirect(req.header('Referer'))
                            })

                    } else {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Email not exist');
                        return res.redirect(req.header('Referer'))
                    }
                },
                (e) => {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Internal Server Error');
                    return res.redirect(req.header('Referer'))
                }
            )
        }
    },

    resetPassword: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render('admin/auth/reset-password', {
            message,
            error,
            formValue
        })
    },

    resetPasswordotp: async(req, res) => {
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
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            const isOtpExist = await User_otp.findOne({
                where: {
                    otp: reqParam.otp,
                    email: reqParam.email,
                    // otp_expiry: {
                    //     [Op.gte]: moment()
                    // }
                },
            }).then((isOtpExistData) => isOtpExistData)
            if (isOtpExist) {
                const userEmailExist = await admin.findOne({
                    where: {
                        email: reqParam.email,
                    },
                }).then((userEmailData) => userEmailData)
                if (userEmailExist) {
                    const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
                    await admin.update({ password: passwordHash }, {
                        where: {
                            id: userEmailExist.id,
                        },
                    }).then(async(result) => {
                        if (result) {

                            const locals = {
                                username: userEmailExist.username,
                                appName: Helper.AppName,
                                otp: reqParam.otp,
                                password: reqParam.password
                            };
                            const mail = await Mailer.sendMail(userEmailExist.email, 'Reset Password!', Helper.forgotTemplate, locals);

                            req.flash('success', 'Password Changed !');
                            res.redirect('/admin/login')
                        }
                    }).catch(() => {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Something went wrong');
                        res.redirect(req.header('Referer'))
                    })
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
        // })
    },
    getChangePassword: async(req, res, next) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render('admin/auth/change-password', {
            message,
            error,
            formValue
        })
    },

    changePassword: async(req, res, next) => {
        const reqParam = req.body;
        const { authUserId } = req;
        console.log("authUserId : ", authUserId);
        const reqObj = {
            previous_password: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.string().required().valid(Joi.ref('password')).required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            return next(error);
        } else {
            let userData = await admin.findByPk(authUserId);
            if (!userData) {
                req.flash('formValue', reqParam);
                req.flash('error', 'User does not exits ', '');
                res.redirect(req.header('Referer'))
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
                            return res.redirect('/admin/dashboard');
                        } else {
                            req.flash('formValue', reqParam);
                            req.flash('error', 'Please enter a correct password ', '');
                            res.redirect(req.header('Referer'))
                            return next("Please enter a correct password");
                        }
                    }
                )

                // res.json(userData);
            }
        }
    },


    logOut: async(req, res) => {
        res.clearCookie('x-token');
        res.redirect("/admin/login")
    }

}