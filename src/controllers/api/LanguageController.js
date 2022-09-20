const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { Language,UserLanguage,User } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    LanguageList: async (req, res) => {
        const requestParams = req.query
        let search = false
        let query,limit = null;
        if(requestParams.page) limit = 10;
        const pageNo = requestParams.page && requestParams.page > 0
                ? parseInt(requestParams.page, 10)
                : 1
        const offset = (pageNo - 1) * limit
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    name: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }

        let sorting = [['updatedAt', 'DESC']]

        if (
            requestParams.filter_by_name &&
            requestParams.filter_by_name !== ''
        ) {
            query = {
                ...query,
                [Op.and]: {
                    name: requestParams.filter_by_name,
                },
            }
        }
         query ={
             status: {
                 [Op.not]: DELETE,
             }
         }
        const options = {
            where: query,
            order: sorting,
            offset: offset
        };
        if(limit) options['limit'] = limit;
        await Language.findAndCountAll(options)
            .then((data) => {
            if (data.rows.length > 0) {
                const extra = []
                extra.per_page = limit
                extra.total = data.count
                extra.page = pageNo
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__('Success'),
                    extra
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

    UserLanguageList: async (req, res) => {
        const {authUserId} = req
        await UserLanguage.findAndCountAll({
            where:{
                user_id:authUserId,
                status: {
                    [Op.not]: DELETE,
                }
            },
            include:[{
                model: Language,
                attributes: ['id', 'name'],
                id: {
                    [Op.eq]: ['language_id'],
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
     * @description 'This function is use to add languages.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddLanguage: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            language_ids: Joi.string().required()
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {


            await UserLanguage.destroy({
                where:{
                    user_id : authUserId
                }
            })
            .then(data => console.log("deleted , ", data))



            await User.findOne({
                where: {
                    id: authUserId,
                    status: {
                        [Op.not]: DELETE,
                    }
                },
            })
                // eslint-disable-next-line consistent-return
                .then(async (userData) => {
                    if (userData) {
                        let result;
                        try {
                            let Langauages = reqParam.language_ids.split(',');
                            
                            console.log("multiple ");
                            let langArr = [];

                            Langauages.forEach( async element => {
                                langArr.push(
                                    {
                                        language_id: element,
                                        user_id:userData.id,
                                        status:ACTIVE
                                    }
                                )
                                
                            });
                            UserLanguage.bulkCreate(langArr)
                            .then(async (result) => {
                                if (result) {
                                    return Response.successResponseData(
                                        res,
                                        result,
                                        SUCCESS,
                                        res.locals.__('Languages added')
                                    )
                                }
                            })
                            .catch(async (e) => {
                                console.log("error ::: , ", e);
                                return Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            })

                            
                        } catch (error) {
                            const langObj ={
                                language_id: reqParam.language_ids,
                                user_id:userData.id,
                                status:ACTIVE
                            }
                            result = await UserLanguage.create(langObj)
                            .then(async (result) => {
                                if (result) {
                                    return Response.successResponseData(
                                        res,
                                        result,
                                        SUCCESS,
                                        res.locals.__('Language added')
                                    )
                                }
                            })
                        }

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
    },
    /**
     * @description 'This function is use to add languages.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    EditLanguage: async (req, res) => {
        const reqParam = req.body;
        const {authUserId} = req
        const requestObj = {
            language_id: Joi.number().required(),
            id:Joi.number().required(),
        }
        const schema = Joi.object(requestObj)
        const {error} = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit profile validation', error))
            )
        } else {
            await UserLanguage.findOne({
                where: {
                    id:reqParam.id,
                    user_id:authUserId,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            }).then(async (userData) => {
                    if (userData) {
                        UserLanguage.update({language_id:reqParam.language_id}, {
                            where: {
                                id: reqParam.id,
                            },
                        }).then(async (updateData, err) => {
                            if (updateData) {
                                return Response.successResponseData(
                                        res,
                                        res.locals.__('Language update success')
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
                            res.locals.__('Language not available')
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
     * @description delete single language
     * @param req
     * @param res
     * */
    deleteLanguage: async (req, res) => {
        const requestParam = req.params
        const languageData = await UserLanguage.findByPk(requestParam.id)
        if (languageData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            languageData.status = DELETE
            languageData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Language deleted'),
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