const Joi = require('@hapi/joi')
const Response = require('./Response')
const Helper = require('./Helper')

module.exports = {
    LoginValidation: (req, res, callback) => {
        const reqObj = {
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }
        if (req.type === 1) {
            reqObj.otp = Joi.string().trim().max(4).required()
        }

        if (req.type === 2) {
            reqObj.password = Joi.string().trim().required()
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(req)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('LoginValidation', error))
            )
        }
        return callback(true)
    },
    signUpValidation: (req, res, callback) => {
        const reqObj = {
            first_name: Joi.string().trim().max(50).required(),
            last_name: Joi.string().trim(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),

        }
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(req)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('signUpValidation', error))
            )
        }
        return callback(true)
    },
    forgotPasswordValidation: (req, res, callback) => {
        const schema = Joi.object({
            email: Joi.string().trim().email().max(150).required(),
        })
        const { error } = schema.validate(req)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('forgotPasswordValidation', error))
            )
        }
        return callback(true)
    },
}