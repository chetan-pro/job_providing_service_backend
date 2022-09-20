const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment')
const path = require('path')
const {
    SUCCESS,
    FAIL,YES,NO,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,USER_CERTIFICATE,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { Certification } = require('../../models')

module.exports = {
    UserCertificationList: async (req, res) => {
        const {authUserId} = req
        let promise =[];
        let finaldata =[];
        await Certification.findAndCountAll({
            where:{
                user_id:authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            }
        }).then(async (data) => {
            if (data.rows.length > 0) {
                console.log(Array.isArray(data))
                await data.rows.forEach(function (result) {
                    promise.push(new Promise(async (resolve, reject) => {
                        result.file = Helper.mediaUrl(
                            USER_CERTIFICATE,
                            result.file
                        )
                        resolve(true)
                    }))
                })
                Promise.all(promise).then(async () => {
                    return Response.successResponseData(
                        res,
                        data,
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
     * @description 'This function is use to add certificate'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddCertification: async (req, res) => {
        const reqParam = req.fields;
        console.log(reqParam)
        const {authUserId} = req
        let file = false;
        const requestObj = {
            title:Joi.string().required(),
            file_name:Joi.string().required(),
            institute_name:Joi.string().required(),
            year_of_achieving_certificate: Joi.number().required(),
            file:Joi.string().optional(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            console.log(req.files.file)
            if (req.files.file && req.files.file.size > 0) {
                file =true;
            }
            if(req.files.file && req.files.file.size < 0)
            {
                return Response.errorResponseData(res, res.__('File invalid'), BAD_REQUEST);
            }
            console.log(file)
            const FileName = file ? `${moment().unix()}${path.extname(req.files.file.name)}` : '';

            const Obj = {
                user_id:authUserId,
                title:reqParam.title,
                file_name: reqParam.file_name,
                institute_name:reqParam.institute_name,
                year_of_achieving_certificate: reqParam.year_of_achieving_certificate,
                file:FileName,
                status: ACTIVE
            }
            await Certification.create(Obj)
                .then(async (result) => {
                    if (result) {
                        if (file) {
                            await Helper.FileUpload(req, res, FileName);
                        }
                        return Response.successResponseData(
                            res,
                            result,
                            res.__('Certification added')
                        )
                    }
                })
                .catch(async (e) => {
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
     * @description 'This function is use to edit certificate.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditCerificate: async (req, res) => {
        const reqParam = req.fields;
        const {authUserId} = req
        let file = false;
        const requestObj = {
            id:Joi.number().required(),
            title:Joi.string().required(),
            file_name:Joi.string().required(),
            institute_name:Joi.string().required(),
            year_of_achieving_certificate: Joi.number().required(),
            file:Joi.string().optional(),
        }
        console.log("hdavdhj",reqParam.file)
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            if (req.files.file && req.files.file.size > 0) {
                file =true;
            }
            if(req.files.file && req.files.file.size < 0)
            {
                return Response.errorResponseData(res, res.__('File invalid'), BAD_REQUEST);
            }
            var FileName = file ? `${moment().unix()}${path.extname(req.files.file.name)}` : '';
            console.log(FileName)
            await Certification.findOne({
                where: {
                    id: reqParam.id,
                    user_id: authUserId
                },
            }).then(async (Data) => {
                if (Data) {
                    const CertificateObj = {
                        title: reqParam.title,
                        file_name:reqParam.file_name,
                        institute_name: reqParam.institute_name,
                        year_of_achieving_certificate: reqParam.year_of_achieving_certificate,
                        file: FileName? FileName:Data.file,
                        status: ACTIVE
                    }
                    Certification.update(CertificateObj, {
                        where: {
                            id: reqParam.id
                        },
                    }).then(async (updateData, err) => {
                        if (updateData) {
                            if (file) {
                                await Helper.FileUpload(req, res, FileName);
                            }
                            const certificateData = await Certification.findByPk(reqParam.id);
                            return Response.successResponseData(
                                res,
                                certificateData,
                                SUCCESS,
                                res.locals.__('Certificate update success')
                            )

                        } else {
                            return Response.errorResponseData(
                                res,
                                res.__('Something went wrong')
                            )
                        }
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Certificate not found')
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
     * @description delete single certificate
     * @param req
     * @param res
     * */
    DeleteCertificate: async (req, res) => {
        const requestParam = req.params
        const CertificateData = await Certification.findByPk(requestParam.id)
        if (CertificateData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            CertificateData.status = DELETE
            CertificateData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Certificate deleted'),
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