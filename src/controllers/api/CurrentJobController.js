const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const moment = require('moment');

const {
    SUCCESS,
    FAIL,YES,NO,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,MONTH,DAYS,MONTHLY,ANNUAL,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { WorkExperience } = require('../../models')

module.exports = {
    UserCurrentJob: async (req, res) => {
        const {authUserId} = req
        await WorkExperience.findOne({
            where:{
                user_id:authUserId,
                active_job:YES,
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
     * @description 'This function is use to add work experience'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddCurrentJob: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            currently_employed:Joi.string().valid(YES,NO).required(),
            job_title:Joi.string().required(),
            company_name: Joi.string().required(),
            industry_id:Joi.number().required(),
            job_description:Joi.string().required(),
            current_salary:Joi.number().required(),
            salary_type:Joi.string().valid(ANNUAL,MONTHLY).required(),
            date_of_joining: Joi.date().required(),
            notice_period_type: Joi.when('notice_period', {
                is: Joi.exist().valid(YES),
                then: Joi.string().valid(DAYS,MONTH).required(),
            }),
            notice_period: Joi.string().valid(YES,NO).required(),
            notice_period_days: Joi.when('notice_period', {
                is: Joi.exist().valid(YES),
                then: Joi.number().required(),
            })
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            const WorkExpObj = {
                currently_employed:reqParam.currently_employed,
                user_id:authUserId,
                job_title: reqParam.job_title,
                company_name: reqParam.company_name,
                industry_id: reqParam.industry_id,
                job_description: reqParam.job_description,
                current_salary:reqParam.current_salary,
                salary_type: reqParam.salary_type,
                date_of_joining: reqParam.date_of_joining,
                notice_period:reqParam.notice_period,
                notice_period_days: reqParam.notice_period_days,
                notice_period_type: reqParam.notice_period_type,
                active_job: YES,
                status: ACTIVE
            }
            await WorkExperience.create(WorkExpObj)
                .then(async (result) => {
                    if (result) {
                        Response.successResponseData(
                            res,
                            result,
                            res.__('Current job added')
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
     * @description 'This function is use to edit work experience.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditCurrentJob: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            id:Joi.number().required(),
            currently_employed:Joi.string().valid(YES,NO).required(),
            job_title:Joi.string().required(),
            company_name: Joi.string().required(),
            industry_id:Joi.number().required(),
            job_description:Joi.string().required(),
            current_salary:Joi.number().required(),
            salary_type:Joi.string().valid(ANNUAL,MONTHLY).required(),
            date_of_joining: Joi.date().required(),
            notice_period_type: Joi.when('notice_period', {
                is: Joi.exist().valid(YES),
                then: Joi.string().valid(DAYS,MONTH).required(),
            }),
            notice_period: Joi.string().valid(YES,NO).required(),
            notice_period_days: Joi.when('notice_period', {
                is: Joi.exist().valid(YES),
                then: Joi.number().required(),
            })
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await WorkExperience.findOne({
                where: {
                    id: reqParam.id,
                    user_id:authUserId
                },
            }).then(async (Data) => {
                if (Data) {
                    const WorkExpObj = {
                        currently_employed: reqParam.currently_employed,
                        user_id: authUserId,
                        job_title: reqParam.job_title,
                        company_name: reqParam.company_name,
                        industry_id: reqParam.industry_id,
                        job_description: reqParam.job_description,
                        salary_type: reqParam.salary_type,
                        current_salary: reqParam.current_salary,
                        date_of_joining: reqParam.date_of_joining,
                        notice_period: reqParam.notice_period,
                        notice_period_days: reqParam.notice_period_days,
                        notice_period_type: reqParam.notice_period_type,
                    }
                    WorkExperience.update(WorkExpObj, {
                        where: {
                            id: reqParam.id,
                            user_id: authUserId,
                            status: ACTIVE,
                            active_job: YES
                        },
                    }).then(async (updateData, err) => {
                        if (updateData) {
                            const workData = await WorkExperience.findByPk(reqParam.id);
                            return Response.successResponseData(
                                res,
                                workData,
                                SUCCESS,
                                res.locals.__('Current job update success')
                            )
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('Current job not found')
                            )
                        }
                    }).catch((e) => {
                        return Response.errorResponseData(res, res.__('Something went wrong'))
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Current job not available')
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
    deleteCurrentJob: async (req, res) => {
        const requestParam = req.params
        const workExpData = await WorkExperience.findByPk(requestParam.id)
        if (workExpData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            workExpData.date_of_resigning = moment();
            workExpData.active_job = 'N';
            workExpData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Current job deleted'),
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