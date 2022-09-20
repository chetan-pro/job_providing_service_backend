const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,YES,NO,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { Education,Specialization,Course,EducationData } = require('../../models')

module.exports = {
    UserEducationList: async (req, res) => {
        const {authUserId} = req
        await Education.findAndCountAll({
            where:{
                user_id:authUserId,
                status: {
                    [Op.not]: DELETE,
                }
            },
            include:[
                {
                    model: EducationData,
                    attributes: ['id', 'name'],
                    id: {
                        [Op.eq]: ['education_id'],
                    }
                },
                {
                    model: Specialization,
                    attributes: ['id', 'name'],
                    id: {
                        [Op.eq]: ['specialization_id'],
                    }
                },
                {
                    model: Course,
                    attributes: ['id', 'name'],
                    id: {
                        [Op.eq]: ['course_id'],
                    }
                }
            ]
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
        }, (e) => {
            console.log(e);
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },

    /**
     * @description 'This function is use to add education'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddEducation: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            education_id:Joi.number().required(),
            course_id: Joi.when('education_id', {
            is: Joi.exist().valid(1,2),
            then: Joi.number().optional(),
            }).required(),
            specialization_id: Joi.when('education_id', {
            is: Joi.exist().valid(1,2,3),
            then: Joi.number().optional(),
            }).required(),
            institute_name:Joi.string().required(),
            year_of_passing: Joi.number().required(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            const EduObj = {
                user_id:authUserId,
                education_id: reqParam.education_id,
                course_id:reqParam.course_id,
                specialization_id:reqParam.specialization_id,
                institute_name:reqParam.institute_name,
                year_of_passing: reqParam.year_of_passing,
                status: ACTIVE
            }
            await Education.create(EduObj)
                .then(async (result) => {
                    if (result) {
                        Response.successResponseData(
                            res,
                            result,
                            res.__('Education added')
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
     * @description 'This function is use to edit education.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    EditEducation: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            id:Joi.number().required(),
            education_id:Joi.number().required(),
            course_id: Joi.when('education_id', {
                is: Joi.exist().valid(1,2),
                then: Joi.number().optional(),
            }).required(),
            specialization_id: Joi.when('education_id', {
                is: Joi.exist().valid(1,2,3),
                then: Joi.number().optional(),
            }).required(),
            institute_name:Joi.string().required(),
            year_of_passing: Joi.number().required(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await Education.findOne({
                where: {
                    id: reqParam.id,
                    user_id: authUserId
                },
            }).then(async (eduData) => {
                if (eduData) {
                    const EduObj = {
                        education_id:reqParam.education_id,
                        course_id: reqParam.course_id,
                        specialization_id: reqParam.specialization_id,
                        institute_name: reqParam.institute_name,
                        year_of_passing: reqParam.year_of_passing,
                    }
                    Education.update(EduObj, {
                        where: {
                            id: reqParam.id
                        },
                    }).then(async (updateData, err) => {
                        if (updateData) {
                            console.log("update", updateData)
                            await Education.findOne({
                                where: {
                                    id: reqParam.id,
                                    user_id: authUserId
                                },
                            }).then(async (workData) => {
                                if (workData) {
                                    return Response.successResponseData(
                                        res,
                                        workData,
                                        SUCCESS,
                                        res.locals.__('Education update success')
                                    )
                                } else {
                                    return Response.successResponseWithoutData(
                                        res,
                                        res.locals.__('Education not found')
                                    )
                                }
                            }).catch((e) => {
                                return Response.errorResponseData(res, res.__('Something went wrong'))
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
                        res.locals.__('Education not found')
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
     * @description delete single education
     * @param req
     * @param res
     * */
    DeleteEducation: async (req, res) => {
        const requestParam = req.params
        const eduData = await Education.findByPk(requestParam.id)
        if (eduData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            eduData.status = DELETE
            eduData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Education deleted'),
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