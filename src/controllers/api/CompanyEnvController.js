const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment')
const path = require('path')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,USER_IMAGE,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { CompanyEnv,User } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get Company Env list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    CompanyPhotoList: async (req, res) => {
    const {authUserId} = req
        let promise =[];
    await CompanyEnv.findAndCountAll({
        where:{
            user_id:authUserId,
            status: {
                [Op.not]: DELETE,
            }
        },
        order :[['id','DESC']]
    }).then(async (Data) => {
        if (Data.rows.length > 0) {
            await Data.rows.forEach(function (resultId) {
                promise.push(new Promise(async (resolve, reject) => {
                    resultId.image = Helper.mediaUrl(
                        USER_IMAGE,
                        resultId.image
                    )
                    resolve(true)
                }))
            })
            Promise.all(promise).then(async () => {
                return Response.successResponseData(
                    res,
                    Data,
                    SUCCESS,
                    res.locals.__('Success'),
                )
            })
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
     * @description 'This function is use to add Company Env.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddCompanyPhoto: async (req, res) => {
        const reqParam = req.fields;
        const {authUserId} = req
        let image;
        const requestObj = {
            title: Joi.string().required(),
            description: Joi.string().required(),
            image:Joi.string().optional(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            if (req.files.image && req.files.image.size > 0) {
                image = true;
                const extension = req.files.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }
            }
            const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';

            const langObj = {
                title: reqParam.title,
                user_id: authUserId,
                description: reqParam.description,
                image: imageName,
                status: ACTIVE
            }
            await CompanyEnv.create(langObj)
                .then(async (result) => {
                    if (result) {
                        if (image) {
                            await Helper.ImageUpload(req, res, imageName);
                        }
                        Response.successResponseData(
                            res,
                            result,
                            res.__('Company image added')
                        )
                    }
                })
                .catch(async () => {
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },
    /**
     * @description 'This function is use to add languages.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditCompanyPhoto: async (req, res) => {
        const reqParam = req.fields;
        const {authUserId} = req
        let image;
        const requestObj = {
            id: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            image:Joi.string().optional(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            if (req.files.image && req.files.image.size > 0) {
                image = true;
                const extension = req.files.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }
            }
            const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';
            await CompanyEnv.findOne({
                where: {
                    id: reqParam.id,
                    user_id:authUserId
                },
            }).then(async (Data) => {
                if (Data) {
                    const Obj = {
                        title: reqParam.title,
                        description: reqParam.description,
                        image: imageName
                    }
                    CompanyEnv.update(Obj, {
                        where: {
                            id: reqParam.id
                        },
                    }).then(async (updateData, err) => {
                        if (updateData) {
                            const photoData = await CompanyEnv.findByPk(reqParam.id)
                            return Response.successResponseData(
                                res,
                                photoData,
                                SUCCESS,
                                res.locals.__('Company image update success')
                            )
                        } else {
                            return Response.errorResponseData(
                                res,
                                res.__('Something went wrong')
                            )
                        }
                    }).catch(async () => {
                        Response.errorResponseData(
                            res,
                            res.__('Internal error'),
                            INTERNAL_SERVER
                        )
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Company photo not found')
                    )
                }
            }).catch((e) => {
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
        }
    },
    /**
     * @description delete single company image
     * @param req
     * @param res
     * */
    deleteCompanyPhoto: async (req, res) => {
        const requestParam = req.params
        const companyData = await CompanyEnv.findByPk(requestParam.id)
        if (companyData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            companyData.status = DELETE
            companyData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Company image deleted'),
                        SUCCESS
                    )
                })
                .catch(() => {
                    Response.errorResponseData(
                        res,
                        res.__('Something went wrong'),
                        BAD_REQUEST
                    )
                })
        }
    },
}