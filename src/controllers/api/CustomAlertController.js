const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const Mailer = require('../../services/Mailer')

const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    DELETE,
    ACTIVE,BAD_REQUEST,USER_ROLE_TYPE
} = require('../../services/Constants')
const { CustomAlert,Industry,Sector,state,city,User,JobRoleType} = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get custom alert list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    UserCustomAlertList: async (req, res) => {
        const {authUserId} = req
        await CustomAlert.findAndCountAll({
            where:{
                user_id:authUserId,
                status: {
                    [Op.not]: DELETE
                }
            },
            include:[
                {
                    model: Industry,
                    attributes: ['id', 'name'],
                    id: {
                        [Op.eq]: ['industry_id'],
                    }
                },
                {
                    model: JobRoleType,
                    attributes: ['id', 'name'],
                },
                {
                    model: Sector,
                    attributes: ['id', 'name'],
                    id: {
                        [Op.eq]: ['sector_id'],
                    }
                },
                {
                    model: User,
                    attributes: ['id', 'name'],
                        id: {
                            [Op.eq]: ['company_id'],
                        }
                },
                {
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
                    }
                },
            ]
        }).then(async (Data) => {
            if (Data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        Data,
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
        }, (e) => {
            console.log(e)
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },

    /**
     * @description 'This function is use to add Custom Alert list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddCustomAlert: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            industry_id: Joi.number().required(),
            sector_id: Joi.number().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            job_role_type_id: Joi.number().required(),
            company_id:Joi.number().required(),
            pin_code : Joi.number().required(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Custom alert validation', error))
            )
        } else {
            const customAlertObj = {
                user_id: authUserId,
                industry_id:reqParam.industry_id ,
                sector_id: reqParam.sector_id,
                state_id: reqParam.state_id,
                city_id: reqParam.city_id,
                job_role_type_id: reqParam.job_role_type_id,
                company_id: reqParam.company_id,
                status: ACTIVE, 
                pin_code : reqParam.pin_code
            }
            let userDets = await User.findByPk(authUserId);

            await CustomAlert.create(customAlertObj)
                .then(async (result) => {

                    let emailData = await CustomAlert.findOne({
                        where:{
                            id : result.id
                        },
                        include:[
                            {
                                model : city
                            },{
                                model : state
                            },{
                                model: Industry
                            },{
                                model: JobRoleType
                            },{
                                model: User,
                                where:{
                                    id : reqParam.company_id
                                }
                            }
                        ]
                    })

                    const locals = {
                        username: userDets.name,
                        jobRole: emailData.JobRoleType.name,
                        industry : emailData.Industry.name,
                        pinCode :  emailData.pin_code,
                        state : emailData.state.name,
                        city: emailData.city.name ,
                        companyName: emailData.User.name,
                        appName: Helper.AppName,
                    };
        
                    Mailer.sendMail(userDets.email,'Custom Alert Added', Helper.customAlertAdd, locals);
        
                    if (result) {
                        Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__('Custom alert added'),
                        )
                    }
                })
                .catch(async (e) => {
                    console.log("error :: , " , e);
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },
    /**
     * @description 'This function is use to add custom alert.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditCustomAlert: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            id: Joi.number().required(),
            industry_id: Joi.number().required(),
            sector_id: Joi.number().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            job_role_type_id: Joi.number().required(),
            company_id: Joi.number().required()
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Custom alert validation', error))
            )
        } else {
            await CustomAlert.findOne({
                where: {
                    id: reqParam.id,
                    user_id:authUserId,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            }).then(async (customData) => {
                if (customData) {
                    const Obj = {
                        industry_id: reqParam.industry_id,
                        sector_id: reqParam.sector_id,
                        state_id: reqParam.state_id,
                        city_id: reqParam.city_id,
                        job_role_type_id: reqParam.job_role_type_id,
                        company_id: reqParam.company_id,
                    }
                    CustomAlert.update(Obj, {
                        where: {
                            id: reqParam.id
                        },
                    }).then(async (updateData, err) => {
                        if (updateData) {
                            const Data = await CustomAlert.findByPk(reqParam.id)
                            return Response.successResponseData(
                                res,
                                Data,
                                SUCCESS,
                                res.locals.__('Custom alert update success')
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
                        res.locals.__('Custom alert not available')
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
     * @description delete single custom alert
     * @param req
     * @param res
     * */
    deleteCustomAlert: async (req, res) => {
        const requestParam = req.params
        const customAlertData = await CustomAlert.findByPk(requestParam.id)
        if (customAlertData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            customAlertData.status = DELETE
            customAlertData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Custom alert image deleted'),
                        SUCCESS
                    )
                }).catch(() => {
                       Response.errorResponseData(
                        res,
                        res.__('Something went wrong'),
                        BAD_REQUEST
                    )
                })
        }
    },

    /**
     * @description 'This function is use to  get company list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    CompanyList: async (req, res) => {
        await User.findAndCountAll({
            where:{
                user_role_type:USER_ROLE_TYPE.company
            },
        }).then(async (Data) => {
            if (Data.rows.length > 0) {
                return Response.successResponseData(
                    res,
                    Data,
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

}