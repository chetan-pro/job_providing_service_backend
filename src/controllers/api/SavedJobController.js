const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,YES,NO,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,MONTH,DAYS,MONTHLY,ANNUAL,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { UserSavedJobs,JobPost,Industry,JobRoleType,Sector,JobType,Question,city,state,SkillSubCategory,JobPostSkill,EducationData} = require('../../models')

module.exports = {
    UserSavedJobsList: async (req, res) => {
        const requestParams = req.query
        const {authUserId} = req
        let limit = null;
        if(requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0
                ? parseInt(requestParams.page, 10)
                : 1
        let sorting = [['updatedAt', 'DESC']]
        let arr=[
            {
                model: Industry,
                attributes: ['id', 'name']
            },
            {
                model: Sector,
                attributes: ['id', 'name']
            },
            {
                model: JobType,
                attributes: ['id', 'name']
            },
            {
                model: city,
                attributes: ['id', 'name']
            },
            {
                model: state,
                attributes: ['id', 'name']
            },
            {
                model: EducationData,
                attributes: ['id', 'name']
            },
            {
                model: Question,
                attributes: ['id', 'questions'],
            },
            {
                model: JobRoleType,
                attributes: ['id', 'name'],
            },

            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include:
                    {
                        model: SkillSubCategory,
                        attributes: ['id', 'name', 'skill_category_id'],
                    }
            },
            {
                model : User,
                required : true,
                attributes:[],
                where:{
                    status : {
                        [Op.eq] : ACTIVE 
                    }
                }
            },
        ]
        const offset = (pageNo - 1) * limit
        const options = {
            include:{
                model:JobPost,
                include: arr
            },
            where: {
                user_id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            },
            order: sorting,
            offset:offset
        };

        if(limit) options['limit'] = limit;
        await UserSavedJobs.findAndCountAll(options).then((data) => {
            if (data.rows .length > 0) {
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

    /**
     * @description 'This function is use to add  user job'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddUserSavedJob: async (req, res) => {
        const reqParam = req.params;
        const {authUserId} = req
        const WorkExpObj =    {
            job_post_id: reqParam.id,
            user_id: authUserId,
            status: ACTIVE
        }
        await UserSavedJobs.create(WorkExpObj)
            .then(async (result) => {
                if (result) {
                    Response.successResponseData(
                        res,
                        result,
                        res.__('Saved job added')
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
    },

    /**
     * @description delete single saved job
     * @param req
     * @param res
     * */
    deleteSavedJob: async (req, res) => {
        const requestParam = req.params
        const jobData = await UserSavedJobs.findByPk(requestParam.id)
        if (jobData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            jobData.status = DELETE
            jobData.save()
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Saved job deleted'),
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