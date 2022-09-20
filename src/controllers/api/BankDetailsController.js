const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment')
const path = require('path')
const {
    SUCCESS,
    FAIL,
    YES,
    NO,
    INTERNAL_SERVER,
    DELETE,
    PER_PAGE,
    USER_CERTIFICATE,
    ACTIVE,
    BAD_REQUEST
} = require('../../services/Constants')
const { BankDetails } = require('../../models')

module.exports = {
    GetBankDetail: async(req, res) => {
        const { authUserId } = req
        await BankDetails.findOne({
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                }
            }
        }).then((data) => {
            if (data) {
                return Response.successResponseData(
                res,
                data,
                    SUCCESS,
                    res.locals.__('Success'),
                )
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }
        }, () => {
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },



    /**
     * @description 'This function is use to add bank details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddBankDetails: async(req, res) => {
        const reqParam = req.body;
        console.log(reqParam)
        const { authUserId } = req
        const requestObj = {
            bank_name: Joi.string().required(),
            branch_name: Joi.string().required(),
            full_registered_name: Joi.string().required(),
            ifsc_code: Joi.string().required(),
            bank_account_number: Joi.string().required(),
            bank_account_type: Joi.string().required(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            const Obj = {
                user_id: authUserId,
                bank_name: reqParam.bank_name,
                branch_name: reqParam.branch_name,
                full_registered_name: reqParam.full_registered_name,
                ifsc_code: reqParam.ifsc_code,
                bank_account_number: reqParam.bank_account_number,
                bank_account_type: reqParam.bank_account_type,
                status: ACTIVE
            }
            await BankDetails.create(Obj)
                .then(async(result) => {
                    if (result) {

                        return Response.successResponseData(
                            res,
                            result,
                            res.__('Bank details validation')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    /**
     * @description 'This function is use to edit bank details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    UpdateBankDetails: async(req, res) => {
        const reqParam = req.body;
        console.log(reqParam)
        const { authUserId } = req
        const requestObj = {
            id: Joi.number().required(),
            bank_name: Joi.string().required(),
            branch_name: Joi.string().required(),
            full_registered_name: Joi.string().required(),
            ifsc_code: Joi.string().required(),
            bank_account_number: Joi.string().required(),
            bank_account_type: Joi.string().required(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {

            await BankDetails.findOne({
                    where: {
                        id: reqParam.id,
                        user_id: authUserId,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                })
                .then(async(customData) => {
                    if (customData) {
                        const Obj = {
                            bank_name: reqParam.bank_name,
                            branch_name: reqParam.branch_name,
                            full_registered_name: reqParam.full_registered_name,
                            ifsc_code: reqParam.ifsc_code,
                            bank_account_number: reqParam.bank_account_number,
                            bank_account_type: reqParam.bank_account_type,
                        }
                        BankDetails.update(Obj, {
                            where: {
                                id: reqParam.id
                            },
                        }).then(async(updateData, err) => {
                            console.log(updateData);
                            if (updateData) {
                                const Data = await BankDetails.findByPk(reqParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Bank details update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Bank details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },


}