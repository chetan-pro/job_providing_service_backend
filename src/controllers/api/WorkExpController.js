const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment');


const {
    SUCCESS,
    FAIL,
    YES,
    NO,
    INTERNAL_SERVER,
    DELETE,
    PER_PAGE,
    ACTIVE,
    BAD_REQUEST
} = require('../../services/Constants')
const { WorkExperience, Industry } = require('../../models')

module.exports = {
    UserWorkExperienceList: async(req, res) => {
        const { authUserId } = req
        await WorkExperience.findAndCountAll({
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
                active_job: NO
            },
            include: [{
                model: Industry,
                attributes: ['id', 'name'],
                id: {
                    [Op.eq]: ['industry_id'],
                }
            }]
        }).then((data) => {
            if (data.rows.length > 0) {
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
     * @description 'This function is use to add work experience'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddWorkExperience: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req
        const requestObj = {
            job_title: Joi.string().required(),
            company_name: Joi.string().required(),
            industry_id: Joi.number().required(),
            job_description: Joi.string().required(),
            date_of_joining: Joi.date().required(),
            date_of_resigning: Joi.date().required(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            const WorkExpObj = {
                user_id: authUserId,
                job_title: reqParam.job_title,
                company_name: reqParam.company_name,
                industry_id: reqParam.industry_id,
                job_description: reqParam.job_description,
                date_of_joining: reqParam.date_of_joining,
                date_of_resigning: reqParam.date_of_resigning,
                active_job: NO,
                status: ACTIVE
            }
            await WorkExperience.create(WorkExpObj)
                .then(async(result) => {
                    if (result) {
                        Response.successResponseData(
                            res,
                            result,
                            res.__('Work experience added')
                        )
                    }
                })
                .catch(async() => {
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },
    /**
     * @description 'This function is use to edit work experience.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditWorkExperience: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req
        const requestObj = {
            id: Joi.number().required(),
            job_title: Joi.string().required(),
            company_name: Joi.string().required(),
            industry_id: Joi.number().required(),
            job_description: Joi.string().required(),
            date_of_joining: Joi.date().required(),
            date_of_resigning: Joi.date().required(),
        }
        const schema = Joi.object(requestObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await WorkExperience.findOne({
                where: {
                    id: reqParam.id,
                    user_id: authUserId,
                    status: {
                        [Op.not]: DELETE,
                    }
                }
            }).then(async(workData) => {
                if (workData) {
                    const WorkExpObj = {
                        job_title: reqParam.job_title,
                        company_name: reqParam.company_name,
                        industry_id: reqParam.industry_id,
                        job_description: reqParam.job_description,
                        date_of_joining: reqParam.date_of_joining,
                        date_of_resigning: reqParam.date_of_resigning,
                    }
                    WorkExperience.update(WorkExpObj, {
                        where: {
                            id: reqParam.id
                        },
                    }).then(async(updateData, err) => {
                        if (updateData) {
                            await WorkExperience.findOne({
                                where: {
                                    id: reqParam.id,
                                    user_id: authUserId,
                                    active_job: NO,
                                    status: {
                                        [Op.not]: DELETE,
                                    }
                                },
                            }).then(async(workData) => {
                                if (workData) {
                                    return Response.successResponseData(
                                        res,
                                        workData,
                                        SUCCESS,
                                        res.locals.__('Work experience updated successfully')
                                    )
                                } else {
                                    return Response.successResponseWithoutData(
                                        res,
                                        res.locals.__('Work experience not found')
                                    )
                                }
                            }).catch((e) => {
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            })
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
                        res.locals.__('Work experience available')
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
     * @description delete single work experience
     * @param req
     * @param res
     * */
    deleteWorkExperience: async(req, res) => {
        const requestParam = req.params
        const workExpData = await WorkExperience.findByPk(requestParam.id)
        if (workExpData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {

            if(!(workExpData.active_job === 'Y')){
                workExpData.status = DELETE
                workExpData.save()
                    .then(() => {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Work experience deleted'),
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
            }else{
                workExpData.date_of_resigning = moment();
                workExpData.active_job = 'N';
                workExpData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Work experience deleted'),
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
        }
    },
}