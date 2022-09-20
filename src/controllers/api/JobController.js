const { Op, QueryTypes } = require('sequelize');
const Seq = require('sequelize');
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const db = require('../../models/index');
var pluck = require("arr-pluck");
const moment = require('moment');


const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    USER_IMAGE,
    ACTIVE,
    DELETE,
    PER_PAGE,
    USER_RESUME,
    GlOBAL_IMAGE_PATH,
    CLOSE,
    OPEN,
    YES,
    NO,
    BOOSTING_TYPE
} = require('../../services/Constants')
const { JobPost, Education, Industry, Sector, UserSkill, UserSavedJobs, UserAppliedJob, UserLikedJobs, CustomAlert, JobRoleType, JobType, Question, User, CompanyEnv, city, state, SkillSubCategory, JobPostSkill, SkillCategory, JobPostEducation, EducationData, NotInterested, SubscribedUser, SubscriptionPlan } = require('../../models')

const { Sequelize } = require("sequelize");

module.exports = {
    /**
     * @description 'This function is use to  get job serach list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    JobSearchList: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req;
        const loggedInUser = await User.findByPk(authUserId);

        let search = false
        let query, limit = null;
        if (requestParams.page) limit = 10;
        let expFrom = requestParams.filter_by_exp_from
        let expTo = requestParams.filter_by_exp_to

        const pageNo = requestParams.page && requestParams.page > 0 ? parseInt(requestParams.page, 10) : 1

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
        query = {
            ...query,
            [Op.and]: {
                status: {
                    [Op.eq]: ACTIVE
                },
                job_status: {
                    [Op.eq]: OPEN
                }
            }
        }
        let sorting = [
            ['createdAt', 'DESC']
        ]
        if (requestParams.order_by && requestParams.order_by !== '') {
            requestParams.direction = requestParams.direction == 'Ascending' ? 'ASC' : 'DESC';
            sorting = [
                [requestParams.order_by, requestParams.direction ? requestParams.direction : 'DESC', ]
            ]
        }
        if (requestParams.filter_by_job_title && requestParams.filter_by_job_title !== '') {
            query = {
                ...query,
                job_title: {
                    [Op.like]: `%${requestParams.filter_by_job_title}%`
                }
            }
        }

        if (requestParams.filter_by_industry && requestParams.filter_by_industry !== '') {
            let industry = await requestParams.filter_by_industry.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                industry_id: {
                    [Op.in]: industry
                }
            }
        }
        if (requestParams.filter_by_sector && requestParams.filter_by_sector !== '') {
            let sector = await requestParams.filter_by_sector.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                sector_id: {
                    [Op.in]: sector
                }
            }
        }
        if (
            requestParams.filter_by_job_role_type && requestParams.filter_by_sector !== '') {
            let job_role_type = await requestParams.filter_by_job_role_type.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                job_role_type_id: {
                    [Op.in]: job_role_type
                }
            }
        }
        if (requestParams.filter_by_city && requestParams.filter_by_city !== '') {
            let cityData = await requestParams.filter_by_city.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                city_id: {
                    [Op.in]: cityData
                }
            }
        }
        if (requestParams.filter_by_state && requestParams.filter_by_state !== '') {
            let stateData = await requestParams.filter_by_state.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                state_id: {
                    [Op.in]: stateData
                }
            }
        }
        if (expFrom && expFrom !== '') {
            query = {...query,
                exp_from: {
                    [Op.gte]: parseInt(expFrom)
                }
            }
        }
        if (expTo && expTo !== '') {
            query = {...query,
                exp_to: {
                    [Op.between]: [expFrom, expTo]
                }
            }
        }
        if (requestParams.filter_by_paid_type && requestParams.filter_by_paid_type !== '') {
            let paidType = requestParams.filter_by_paid_type.split(',');
            query = {
                ...query,
                paid_type: {
                    [Op.in]: paidType
                }
            }
        }
        if (requestParams.filter_by_work_from_home && requestParams.filter_by_work_from_home !== '') {
            let wfh = requestParams.filter_by_work_from_home.split(',');
            query = {
                ...query,
                work_from_home: {
                    [Op.in]: wfh
                }
            }
        }
        if (requestParams.filter_by_job_type && requestParams.filter_by_job_type !== '') {
            let job_type = requestParams.filter_by_job_type;
            console.log("jobType", job_type)
            query = {
                ...query,
                job_type_id: {
                    [Op.eq]: job_type
                }
            }
        }
        if (requestParams.filter_by_employment_type && requestParams.filter_by_employment_type !== '') {
            let employment_type = requestParams.filter_by_employment_type.split(',');
            query = {
                ...query,
                employment_type: {
                    [Op.in]: employment_type
                }
            }
        }
        if (requestParams.filter_by_contract_type && requestParams.filter_by_contract_type !== '') {
            let contract_type = requestParams.filter_by_contract_type.split(',');
            query = {
                ...query,
                contract_type: {
                    [Op.in]: contract_type
                }
            }
        }
        if (requestParams.filter_by_job_schedule && requestParams.filter_by_job_schedule !== '') {
            let job_schedule = requestParams.filter_by_job_schedule.split(',');
            query = {...query,
                job_schedule: {
                    [Op.in]: job_schedule
                }
            }
        }
        if (requestParams.filter_by_education_required && requestParams.filter_by_education_required !== '') {
            let education_required = requestParams.filter_by_education_required.split(',');
            query = {
                ...query,
                education_required: {
                    [Op.in]: education_required
                }
            }
        }
        if (requestParams.filter_by_skill && requestParams.filter_by_skill !== '') {
            let skill = await requestParams.filter_by_skill.split(',').map(function(item) {
                return parseInt(item, 10);
            });
            query = {
                ...query,
                [Op.in]: {
                    skill_sub_category_id: skill
                }
            }
        }
        let arr = [{
                model: Industry,
                attributes: ['id', 'name'],
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
                model: JobRoleType,
                attributes: ['id', 'name'],
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
                where: {
                    user_id: authUserId
                },
                required: false
            },
            {
                model: UserAppliedJob,
                where: { user_id: authUserId },
                required: false
            },
            {
                model: User,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            },
            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name', 'skill_category_id'],
                    required: false
                }
            },

            // active plan condition added

        ]

        if (requestParams.filter_by_job_type !== '2') {
            arr = [...arr, {
                model: SubscribedUser,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    },
                    expiry_date: {
                        [Op.gt]: moment()
                    }
                },
                include: [{
                    model: SubscriptionPlan,
                    required: true,
                    // job boosting condition added
                    where: {
                        job_boosting: {
                            [Op.or]: [BOOSTING_TYPE.One_State, BOOSTING_TYPE.All_State],
                        },
                    },
                    attributes: [],
                }]
            }];
            query = {
                ...query,
                boosting_state_id: {
                    [Op.or]: [null, loggedInUser.state_id]
                },
                literal: Sequelize.where(Sequelize.literal(`date_add(JobPost.createdAt,INTERVAL SubscribedUser.job_boosting_days day)`), '>', new Date())
            }
        }

        let notInterestedJob = await NotInterested.findAll({
            where: {
                user_id: authUserId,
            },
        })
        let notInterestedJobId = pluck(notInterestedJob, 'job_post_id');

        if (notInterestedJobId.length > 0) {
            query = {
                ...query,
                id: {
                    [Op.notIn]: notInterestedJobId
                },

            }
        }
        // state match condition added

        const options = {
            include: arr,
            where: query,
            order: sorting,
            offset: offset,
        };

        if (limit) options['limit'] = limit;

        // for adjusting the pagination, total count
        let totalNumberedData = await JobPost.count({
            include: [{
                model: SubscribedUser,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    },
                    expiry_date: {
                        [Op.gt]: moment()
                    }
                },
                include: [{
                    model: SubscriptionPlan,
                    required: true,
                    // job boosting condition added
                    where: {
                        job_boosting: YES,
                    },
                    attributes: [],
                }]
            }],
            where: {
                boosting_state_id: {
                    [Op.in]: [loggedInUser.state_id, null]
                },
                literal: Sequelize.where(Sequelize.literal(`date_add(JobPost.createdAt,INTERVAL SubscribedUser.job_boosting_days day)`), '>', new Date())
            }
        });

        await JobPost.findAndCountAll(options).then(async(data) => {
            if (requestParams.filter_by_job_type && requestParams.filter_by_job_type === '2') {
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__('Success'),
                )
            }
            query = {
                ...query,
                literal: Sequelize.where(Sequelize.literal(`date_add(JobPost.createdAt,INTERVAL SubscribedUser.job_boosting_days day)`), '<', new Date())
            }

            arr[12].include[0]["where"]["job_boosting"] = {
                [Op.in]: [BOOSTING_TYPE.All_State, BOOSTING_TYPE.One_State]
            }

            const options2 = {
                include: arr,
                where: query,
                order: sorting,
            };

            if (data.rows.length) {
                console.log(" ::: 395 :: length ", data.rows.length);
                if (data.rows.length < 10) {

                    // data Connection completed
                    let limit2 = 10 - data.rows.length;
                    options2['limit'] = limit2;
                    options2['offset'] = 0;
                    let nonBoostedJobs = await JobPost.findAndCountAll(options2).catch(err => console.log(" :line 401 : err :;", err))

                    // defining offset for the next coming nonBoostedJobs
                    await data.rows.push(...nonBoostedJobs.rows)
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success'),
                    )
                } else {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success'),
                        // extra
                    )
                }
            } else {

                // pageNo 
                let limit2 = 10;
                options2['limit'] = limit2;

                // new pagination for the non-boostedJobs only 
                let newpage = await totalNumberedData > 10 ? Math.floor(totalNumberedData / 10) + 1 : 1;

                let newOffset = totalNumberedData % 10;
                options2['offset'] = (pageNo - newpage) * limit2 + newOffset;
                // return res.send({totalNumberedData,newpage,pageNo, opti : options2 , newVal,limit2 ,newOffset})

                let data = await JobPost.findAndCountAll(options2).catch(err => console.log(" :: line 430 : err :;", err))

                if (data && data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success'),
                    )
                }

                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }

            // if (data.rows.length > 0) {
            //     const extra = []
            //     extra.per_page = limit
            //     extra.total = data.count
            //     extra.page = pageNo
            //     return Response.successResponseData(
            //         res,
            //         data,  
            //         SUCCESS,
            //         res.locals.__('Success'),
            //         extra
            //     )
            // } else {
            //     return Response.errorResponseWithoutData(
            //         res,
            //         res.locals.__('No data found'),
            //         FAIL
            //     )
            // }
        }, (e) => {
            console.log("error :: ", e)
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },

    JobPage: async(req, res) => {
        const reqParam = req.params
        const { authUserId } = req

        let arr = [{
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
                model: JobRoleType,
                attributes: ['id', 'name'],
            },
            {
                model: state,
                attributes: ['id', 'name']
            },
            {
                model: EducationData,
                attributes: ['id', 'name'],
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
                model: NotInterested,
                required: false,
                where: { user_id: authUserId },
            },
            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name'],
                },
            },
            {
                model: Question,
                attributes: ['id', 'questions'],
            },
            {
                model: User,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    }
                }
            },
            {
                model: state,
                as: 'boosting_job_state_data'
            }
        ]
        await JobPost.findOne({
            include: arr,
            where: {
                id: reqParam.id
            },
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM user_applied_jobs AS applied
                            WHERE
                            applied.job_post_id = JobPost.id 
                        )`),
                        'appliedUserCount'
                    ]
                ],
            },

        }).then(async(data) => {

            if (data.User) {
                if (data.User.image && data.User.image != "") {
                    data.User[
                        "image"
                    ] = `${GlOBAL_IMAGE_PATH}/${data.User["image"]}`;
                }
                if (data.User.resume && data.User.resume != "") {
                    data.User[
                        "resume"
                    ] = `${USER_RESUME}/${data.User["resume"]}`;
                }
            }

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
        }, (e) => {
            console.log("err", e)
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },
    CompanyPage: async(req, res) => {
        const reqParams = req.params;
        let promise = [];
        let arr = [{
                model: User,
                required: true,
                attributes: [],
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
                model: JobType,
                attributes: ['id', 'name']
            },
            {
                model: UserLikedJobs,
            },
            {
                model: city,
                attributes: ['id', 'name']
            },
            {
                model: JobRoleType,
                attributes: ['id', 'name'],
            },
            {
                model: state,
                attributes: ['id', 'name']
            },
            {
                model: EducationData,
                attributes: ['id', 'name'],
            },
            {
                model: JobPostSkill,
                attributes: ['skill_sub_category_id'],
                include: {
                    model: SkillSubCategory,
                    attributes: ['id', 'name'],
                },
            },
            {
                model: Question,
                attributes: ['id', 'questions'],
            },
        ]
        let userArr = [{
                model: state,
                attributes: ['id', 'name'],
                id: {
                    [Op.eq]: ['state_id'],
                },
            },
            {
                model: city,
                attributes: ['id', 'name'],
                id: {
                    [Op.eq]: ['city_id'],
                }
            },
        ]
        await JobPost.findAll({
            include: arr,
            where: {
                user_id: reqParams.id
            }
        }).then(async(data) => {
            if (data) {
                await CompanyEnv.findAll({
                    where: {
                        user_id: reqParams.id,
                        status: {
                            [Op.not]: DELETE,
                        },
                    }
                }).then(async(result) => {
                    if (result) {
                        await result.forEach(function(resultId) {
                            promise.push(new Promise(async(resolve, reject) => {
                                resultId.image = Helper.mediaUrl(
                                    USER_IMAGE,
                                    resultId.image
                                )
                                resolve(true)
                            }))
                        })
                        Promise.all(promise).then(async() => {
                            const UserData = await User.findByPk(reqParams.id, { include: userArr })
                            let finaldata = {
                                posted_jobs: data,
                                company_photo: result,
                                company_detail: UserData
                            }
                            return Response.successResponseData(
                                res,
                                finaldata,
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
                }, (e) => {
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }
        }, (e) => {
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },

    /**
     * @description My Profile
     * @param req
     * @param res
     */
    ReCommandedJobs: async(req, res) => {
        const requestParams = req.query;
        const { authUserId } = req


        let limit = null;
        if (requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0 ?
            parseInt(requestParams.page, 10) :
            1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]

        console.log(":::: authUserId ::: ,", authUserId);

        let arr = [{
                model: User,
                required: true,
                attributes: [],
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

            // active plan condition added
            {
                model: SubscribedUser,
                required: true,
                attributes: [],
                where: {
                    status: {
                        [Op.eq]: ACTIVE
                    },
                    expiry_date: {
                        [Op.gt]: moment()
                    }
                },
                include: [{
                    model: SubscriptionPlan,
                    required: true,
                    // job boosting condition added
                    where: {
                        job_boosting: {
                            [Op.ne]: BOOSTING_TYPE.No
                        },
                    },
                    attributes: [],
                }]
            },
        ];

        await User.findOne({
                where: {
                    id: authUserId,
                    status: {
                        [Op.not]: DELETE
                    }
                },
                include: [{
                        model: UserSkill,
                        attributes: ['id', 'skill_sub_category_id']
                    }, {
                        model: CustomAlert,
                        attributes: ['company_id', 'industry_id', 'sector_id', 'job_role_type_id', 'state_id', 'city_id', 'status']
                    }, {
                        model: UserLikedJobs,
                        attributes: ['job_post_id'],
                    }, {
                        model: UserSavedJobs,
                        attributes: ['job_post_id'],
                    },
                    {
                        model: NotInterested,
                        required: false,
                    },
                    {
                        model: Education,
                        attributes: ['id'],
                        include: [{
                            model: EducationData,
                            attributes: ['id', 'name']
                        }]
                    }
                ]
            }).then(async(userData) => {
                // return res.json(userData);
                if (userData) {
                    let customAlertMappedIn = {
                        company_id: [],
                        industry_id: [],
                        sector_id: [],
                        job_role_type_id: [],
                        state_id: [],
                        city_id: [],
                    };

                    let likedAurSavedJobs = [];
                    let education_id = [];
                    let notInterested_id = [];
                    for (let i = 0; i < userData['CustomAlerts'].length; i++) {
                        for (let [key, value] of Object.entries(userData['CustomAlerts'][i]['dataValues'])) {
                            if (customAlertMappedIn[key] != undefined && value != null) {
                                customAlertMappedIn[`${key}`].push(value);
                            }
                        }
                    }

                    for (let j = 0; j < userData['UserLikedJobs'].length; j++) {
                        likedAurSavedJobs.push(userData['UserLikedJobs'][j]['job_post_id'])
                    }

                    for (let k = 0; k < userData['UserSavedJobs'].length; k++) {
                        likedAurSavedJobs.push(userData['UserSavedJobs'][k]['job_post_id'])
                    }

                    for (let l = 0; l < userData['Education'].length; l++) {
                        education_id.push(userData['Education'][l]['EducationDatum']['id'])
                    }

                    // return    res.send({data : userData})

                    console.log("::::: userData ::::", userData.NotInteresteds);

                    if (userData['NotInteresteds']) {
                        for (let l = 0; l < userData['NotInteresteds'].length; l++) {
                            notInterested_id.push(userData['NotInteresteds'][l]['job_post_id'])
                        }
                    }

                    const skillsIds = await userData.UserSkills.map(i => i.skill_sub_category_id);
                    if (skillsIds.length > 0) {
                        const jobPostId = await JobPostSkill.findAll({
                            where: {
                                skill_sub_category_id: {
                                    [Op.in]: skillsIds
                                },
                                status: {
                                    [Op.not]: DELETE
                                }
                            }
                        }).then(dat => dat);
                        jobPostId.map(i => likedAurSavedJobs.push(i.job_post_id));
                    }

                    likedAurSavedJobs = [...new Set(likedAurSavedJobs)];

                    let getCitiesFromState = await city.findAll({
                        attributes: [
                            'id'
                        ],
                        where: {
                            state_id: userData.state_id
                        }
                    });

                    getCitiesFromState = getCitiesFromState.map((el) => el.id);

                    // const options = {
                    //     include: arr,
                    //     where: {
                    //         [Op.or]: {
                    //             id: {
                    //                 [Op.in]: jobPostIds
                    //             },
                    //             city_id: {
                    //                 [Op.in]: getCitiesFromState
                    //             },
                    //             state_id: userData.state_id,
                    //             pin_code: userData.pin_code,
                    //         },
                    //     },
                    //     order: sorting,
                    //     offset: offset
                    // };

                    const options = {
                        include: arr,
                        where: {

                            [Op.and]: {
                                status: {
                                    [Op.eq]: ACTIVE
                                },
                                job_status: {
                                    [Op.eq]: OPEN
                                },
                                id: {
                                    [Op.notIn]: notInterested_id
                                },
                                [Op.or]: [{
                                        [Op.and]: {
                                            user_id: {
                                                [Op.in]: customAlertMappedIn['company_id']
                                            },
                                            industry_id: {
                                                [Op.in]: customAlertMappedIn['industry_id']
                                            },
                                            sector_id: {
                                                [Op.in]: customAlertMappedIn['sector_id']
                                            },
                                            job_role_type_id: {
                                                [Op.in]: customAlertMappedIn['job_role_type_id']
                                            },
                                            state_id: {
                                                [Op.in]: customAlertMappedIn['state_id']
                                            },
                                            city_id: {
                                                [Op.in]: customAlertMappedIn['city_id']
                                            },

                                        }
                                    },
                                    {
                                        [Op.or]: {
                                            user_id: {
                                                [Op.in]: customAlertMappedIn['company_id']
                                            },
                                            industry_id: {
                                                [Op.in]: customAlertMappedIn['industry_id']
                                            },
                                            sector_id: {
                                                [Op.in]: customAlertMappedIn['sector_id']
                                            },
                                            job_role_type_id: {
                                                [Op.in]: customAlertMappedIn['job_role_type_id']
                                            },
                                            state_id: {
                                                [Op.in]: customAlertMappedIn['state_id']
                                            },
                                            city_id: {
                                                [Op.in]: customAlertMappedIn['city_id']
                                            },
                                        }

                                    },
                                    {
                                        id: {
                                            [Op.in]: likedAurSavedJobs
                                        }
                                    },
                                    {
                                        education_id: {
                                            [Op.in]: education_id
                                        },
                                    },
                                    {
                                        pin_code: {
                                            [Op.eq]: userData['pin_code']
                                        }
                                    }

                                ],
                                boosting_state_id: {
                                    [Op.or]: [userData.state_id, null]
                                },
                            },
                            literal: Sequelize.where(Sequelize.literal(`date_add(JobPost.createdAt,INTERVAL SubscribedUser.job_boosting_days day)`), '>', new Date())
                        },
                        order: sorting,
                        offset: offset
                    };

                    // all data
                    const options2 = {
                        include: arr,
                        order: sorting,
                        offset: offset,
                        where: {
                            [Op.and]: {
                                status: {
                                    [Op.eq]: ACTIVE
                                },
                                job_status: {
                                    [Op.eq]: OPEN
                                },
                                id: {
                                    [Op.notIn]: notInterested_id
                                },
                                boosting_state_id: {
                                    [Op.or]: [userData.state_id, null]
                                },
                            },
                            literal: Sequelize.where(Sequelize.literal(`date_add(JobPost.createdAt,INTERVAL SubscribedUser.job_boosting_days day)`), '>', new Date())
                        },
                    };

                    if (limit) options['limit'] = limit;
                    if (limit) options2['limit'] = limit;

                    console.log(":;: OPTIONS , ", options ? options : options2);

                    await JobPost.findAndCountAll(options).then(async(data) => {
                        if (data.rows.length > 0) {
                            const extra = []
                            extra.per_page = limit
                            extra.total = data.count
                            extra.page = pageNo

                            console.log("options :: ,", data.rows.length);

                            let arr2 = pluck(data.rows, "id");

                            if (data.rows.length < 4) {
                                let newData = 4 - data.rows.length;
                                let extraData = await JobPost.findAll({
                                    where: {
                                        id: {
                                            [Op.notIn]: arr2
                                        }
                                    },
                                    include: arr,
                                    limit: newData,
                                    order: [
                                        ["createdAt", "DESC"]
                                    ]
                                })
                                await data.rows.push(...extraData)
                            }

                            return Response.successResponseData(
                                res,
                                data,
                                SUCCESS,
                                res.locals.__('Success'),
                                extra
                            )
                        } else {
                            await JobPost.findAndCountAll(options2).then(async(data) => {
                                    const extra = []
                                    extra.per_page = limit
                                    extra.total = data.count
                                    extra.page = pageNo

                                    console.log("options2 :: ,", data.rows.length);
                                    let arr2 = pluck(data.rows, "id");

                                    if (data.rows.length < 4) {
                                        let newData = 4 - data.rows.length;
                                        let extraData = await JobPost.findAll({
                                            where: {
                                                id: {
                                                    [Op.notIn]: arr2
                                                }
                                            },
                                            limit: newData,
                                            include: arr,
                                            order: [
                                                ["createdAt", "DESC"]
                                            ]
                                        })
                                        await data.rows.push(...extraData)
                                    }

                                    return Response.successResponseData(
                                        res,
                                        data,
                                        SUCCESS,
                                        res.locals.__('Success'),
                                        extra
                                    )
                                }).catch((e) => {
                                    console.log(e)
                                    return Response.errorResponseData(res, res.__('Something went wrong'))
                                })
                                // return Response.successResponseData(
                                //     res,
                                //     data,
                                //     SUCCESS,
                                // )
                        }
                    }).catch((e) => {
                        console.log(e)
                        return Response.errorResponseData(res, res.__('Something went wrong'))
                    })
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('UserNotAvailable')
                    )
                }
            })
            .catch((e) => {
                console.log(e)
                return Response.errorResponseData(res, res.__('Something went wrong'))
            })
    },
    /**
     * @description 'This function is use to  job type role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */


    JobTypeRoleList: async(req, res) => {
        const requestParams = req.query
        let search = false
        let query = {}
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
        query = {
            ...query,
            status: {
                [Op.not]: DELETE,
            },
        }
        const options = {
            where: query,
        };
        await JobRoleType.findAndCountAll(options)
            .then((data) => {
                if (data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success')
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
    }
}