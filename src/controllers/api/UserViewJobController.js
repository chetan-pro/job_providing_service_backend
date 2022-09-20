const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL
} = require('../../services/Constants')
const {UserViewJobs , JobPost, Industry, Sector, UserAppliedJob, UserLikedJobs, JobRoleType, JobType, Question, User, city, state, SkillSubCategory, JobPostSkill, EducationData, } = require('../../models')

module.exports = {
    
    addViewjob : async(req,res) =>{
        const requestParams = req.body
        const {authUserId} = req

        const reqObj = {
            job_post_id : Joi.string().required(),
        };

        const schema = Joi.object(reqObj);
        const { error } = schema.validate(requestParams);

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("View job validation", error))
            );
        } else {

            let postDetails =  JobPost.findByPk(requestParams.job_post_id);

            if(!(postDetails && postDetails != '')){
                return Response.errorResponseWithoutData(
					res,
					res.locals.__("Job post does not exist"),
					FAIL
				);
            }else{
                const viewObj = {
                    user_id: authUserId,
                    job_post_id : requestParams.job_post_id
                };
                UserViewJobs.findOrCreate({where:viewObj})
                .then(async result => {
                    if(result[1]){
                        return Response.successResponseData(
                            res,
                            result[0],
                            SUCCESS,
                            res.locals.__("Job view added successfully")
                        );
                    }else{
                        return Response.successResponseData(
                            res,
                            result[0],
                            SUCCESS,
                            res.__("Job already added to view list")
                        );
                    }
                })
                .catch(e => {
                    console.log(e);
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                });

            }
           
        }

    },

    getViewJob: async(req,res) => {
        const {authUserId} = req;
        const {page, sortBy} = req.query;

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page,10) : 26 ;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        let arr = [
            {
                model: Industry,
                attributes: ['id', 'name']
            },
            {
                model: Sector,
                attributes: ['id', 'name']
            },
            {
                model: JobRoleType,
                attributes: ['id', 'name'],
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
                model: UserLikedJobs,
                where: { user_id: authUserId },
                required: false
            },
            {
                model: UserAppliedJob,
                where: { user_id: authUserId },
                required: false
            },
            
            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name', 'skill_category_id'],
                }
            },
            {
                model:User,
                as:'JobPostView',
                where:{id : authUserId},
                attributes:[],
                through:{
                    attributes:[]
                }
            }
        ]

        const options = {
            where:{},
            include:arr,
            offset,
            order: sorting,
        }

        await JobPost.findAndCountAll(options) 
        .then(data =>{
            if(!data){
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("User details not found"),
                    FAIL
                );
            }else{
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.__("User view jobs found successfully")
                );
            }
        })
        .catch(e => {
            console.log(e);
            return Response.errorResponseData(
                res,
                res.__("something Went Wrong")
            );
        });

    }

}