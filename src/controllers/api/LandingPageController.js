const { Op, where } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,
    ACTIVE,
    GlOBAL_IMAGE_PATH,
    USER_ROLE_TYPE
} = require('../../services/Constants')
const { JobPost, Industry, Sector, JobRoleType, JobType, Question, User, city, state, SkillSubCategory, JobPostSkill, EducationData, service, ServiceCategory, serviceDays, ServiceImage, LocalHunarVideos, UserRoles, Testimonials, StaticData } = require('../../models')
const testimonials = require('../../models/testimonials');
const staticdata = require('../../models/staticdata')

module.exports = {

    landingPageJobs: async(req, res) => {
        const requestParams = req.query;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1
        const offset = (pageNo - 1) * 4
        let sorting = [
            ['id', 'DESC']
        ]


        let arr = [{
                model: User,
                required: true,
                attributes: ['name'],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            },
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
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name', 'skill_category_id'],
                }
            },
        ];

        const options = {
            include: arr,
            order: sorting,
            offset: offset,
            limit: 4
        };
        await JobPost.findAndCountAll(options).then(async(data) => {
            return Response.successResponseData(
                res,
                data,
                SUCCESS,
                res.locals.__('Success'),
            )

        }).catch((e) => {
            console.log(e)
            return Response.errorResponseData(res, res.__('Something went wrong'))
        })

    },

    landingPageHomeServices: async(req, res) => {
        AddPath = (ImageArray) => {
            ImageArray.forEach(async SingleImage => {
                SingleImage['image'] = `${GlOBAL_IMAGE_PATH}/${SingleImage.image}`;
            })
        }
        let arr = [{
                model: User,
                attributes: ["id", "name", "city_id", "state_id"],
                include: [{
                        model: city,
                        attributes: ['name']

                    },
                    {
                        model: state,
                        attributes: ['name']

                    }
                ]
            },
            {
                model: serviceDays,
                attributes: ["id", "day_name"],
                through: { attributes: [] }
            },
            {
                model: ServiceCategory,
                attributes: ["id", "category_name"],
                through: { attributes: [] }
            },
            {
                model: ServiceImage,
                attributes: ["id", "image"],
            },
        ];
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            include: arr,
            order: sorting,
            limit: 4
        };
        await service
            .findAndCountAll(options)
            .then(
                async data => {

                    await data.rows.forEach(instance => {
                        AddPath(instance.ServiceImages)
                    })

                    if (data.rows.length > 0) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No data found"),
                            FAIL
                        );
                    }
                },
                err => {
                    console.log(err);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                }
            );
    },

    landingPageLocalHunar: async(req, res) => {
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            order: sorting,
            include: [{
                model: User,
                attributes: ["id", "name", "city_id", "state_id"],
                include: [{
                        model: city,
                        attributes: ['name']

                    },
                    {
                        model: state,
                        attributes: ['name']

                    }
                ]
            }, ],
            limit: 4
        };
        await LocalHunarVideos
            .findAndCountAll(options)
            .then(
                async data => {
                    if (data.rows.length > 0) {
                        for (var SingleVideo of data.rows) {
                            SingleVideo.url = `/assets/videos/${SingleVideo.url}`
                        }
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No video found"),
                            FAIL
                        );
                    }
                },
                err => {
                    console.log(err);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                }
            );
    },

    landingPageCount: async(req, res) => {
        let totalJobSeekersRegistered = await UserRoles.count({
            where: {
                roleType: USER_ROLE_TYPE.candidate
            }
        });
        let totalRecruitersRegistered = await UserRoles.count({
            where: {
                roleType: USER_ROLE_TYPE.company
            }
        });
        let totalGovtJobsPosted = await JobPost.count({
            where: {
                status: ACTIVE,
                job_type_id: 2

            }
        });
        let totalPrivateJobsPosted = await JobPost.count({
            where: {
                status: ACTIVE,
                job_type_id: 1

            }
        });
        let totalHomeServiceProvidersRegistered = await UserRoles.count({
            where: {
                roleType: USER_ROLE_TYPE.home_service_provider
            }
        });
        let totalHomeServiceSeekersRegistered = await UserRoles.count({
            where: {
                roleType: USER_ROLE_TYPE.home_service_seeker
            }
        });
        let totalLocalHunarRegistered = await UserRoles.count({
            where: {
                roleType: USER_ROLE_TYPE.home_service_seeker
            }
        });


        const data = {
            totalJobSeekersRegistered,
            totalRecruitersRegistered,
            totalLocalHunarRegistered,
            totalHomeServiceProvidersRegistered,
            totalHomeServiceSeekersRegistered,
            totalPrivateJobsPosted,
            totalGovtJobsPosted
        }
        return Response.successResponseData(
            res,
            data,
            SUCCESS,
            res.locals.__("Success")
        );

    },

    landingPageTestimonials: async(req, res) => {
        await Testimonials.findAndCountAll({
            include: [{
                    model: city,
                    attributes: ['id', 'name']
                },
                {
                    model: state,
                    attributes: ['id', 'name']
                },
            ]
        }).then((data) => {
            return Response.successResponseData(
                res,
                data,
                SUCCESS,
                res.locals.__("Success")
            );
        });

    },

    landingPageStaticData: async(req, res) => {
        const key = req.params.key;
        await StaticData.findOne({ where: { key: key } }).then((data) => {
            return Response.successResponseData(
                res,
                data,
                SUCCESS,
                res.locals.__("Success")
            );
        });

    }

}