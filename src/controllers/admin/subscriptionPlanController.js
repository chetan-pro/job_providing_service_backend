const {
    Op,
    where
} = require("sequelize");
const moment = require('moment');
const Joi = require("@hapi/joi");
const {
    SubscriptionPlan,
    Role,
    SubscribedUser,
    User
} = require("../../models");
const {
    DELETE,
    SUBSCRIPTION_PLAN_TYPE,
    SUBSCRIPTION_PLAN_TYPE_AREA,
    SUBSCRIPTION_PLAN_SUB_TYPE,
    SUBSCRIPTION_OFFER_TYPE,
    YES,
    NO,
    BOOSTING_TYPE
} = require('../../services/Constants');
const { SubscribedUserDetail } = require("../api/PaymentController");

module.exports = {

    SubscriptionPlanList: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            status
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                [Op.not]: [{
                    status: DELETE
                }, ]
            },
            order: sorting,
            offset: offset,
            limit: limit,
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options['where']['title'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }
        await SubscriptionPlan.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/SubscriptionPlans/subscription_plan', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/SubscriptionPlans/subscription_plan', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        statusfilter
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    SubscriptionPlanDetails: async function(req, res) {
        const id = req.params.id

        await SubscriptionPlan.findByPk(id)
            .then((alldata) => {
                // return res.send(alldata)
                res.render('admin/SubscriptionPlans/SubscriptionPlanDetails', {
                    alldata,
                    id,
                })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    CreateSubscription: async(req, res) => {
        const error = req.flash("error");
        const message = req.flash("success");
        const formValue = req.flash('formValue')[0];

        let connectedPlansMetro = await SubscriptionPlan.findAll({
            where: {
                status: {
                    [Op.ne]: DELETE,
                },
                plan_type_area: SUBSCRIPTION_PLAN_TYPE_AREA.metro
            }
        });

        let connectedPlansNonMetro = await SubscriptionPlan.findAll({
            where: {
                status: {
                    [Op.ne]: DELETE,
                },
                plan_type_area: SUBSCRIPTION_PLAN_TYPE_AREA.non_metro
            }
        });

        console.log(" :: connectedPlansMetro :: ", connectedPlansMetro, " ::: connectedPlansNonMetro ::: , ", connectedPlansNonMetro);

        Role.findAll()
            .then(function(allRoles) {
                res.render("admin/SubscriptionPlans/create_plan", {
                    formValue,
                    message,
                    error,
                    allRoles,
                    connectedPlansMetro,
                    connectedPlansNonMetro,
                    SUBSCRIPTION_PLAN_TYPE,
                    SUBSCRIPTION_PLAN_TYPE_AREA,
                    SUBSCRIPTION_PLAN_SUB_TYPE,
                    SUBSCRIPTION_OFFER_TYPE,
                    BOOSTING_TYPE
                });
            })
    },

    AddSubscriptionPlan: async(req, res) => {
        const data = req.body;

        console.log(":; entered into controller :: data ::", data);

        const schema = Joi.object({
            title: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Title" cannot be an empty field`,
                    'any.required': `"Title" is a required field`,
                }),
            description: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Description" cannot be an empty field`,
                    'any.required': `"Description" is a required field`,
                }),
            amount: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Amount" cannot be an empty field`,
                    'any.required': `"Amount" is a required field`,
                }),
            expiry_days: Joi.number().required()
                .messages({
                    'string.empty': `"Expiry days" cannot be an empty field`,
                    'any.required': `"Expiry days" is a required field`,
                }),
            user_role_type: Joi.string().trim().required()
                .messages({
                    'string.empty': `"User role type " cannot be an empty field`,
                    'any.required': `"User role type " is a required field`,
                }),
            status: Joi.any().required()
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
            offer: Joi.string().allow('').trim().optional(),
            offer_type: Joi.string().allow('').valid(SUBSCRIPTION_OFFER_TYPE.two_month_plan_extension).trim().optional(),
            discounted_amount: Joi.string().trim().optional(),
            job_limit: Joi.number().optional(),
            description_limit: Joi.number().optional(),
            plan_type: Joi.string().trim().valid(
                    SUBSCRIPTION_PLAN_TYPE.validity_plan,
                    SUBSCRIPTION_PLAN_TYPE.resume_data_access_plan,
                    SUBSCRIPTION_PLAN_TYPE.company_branding_plan,
                    SUBSCRIPTION_PLAN_TYPE.limit_extension_plan,
                ).required()
                .messages({
                    'string.empty': `"Plan Type" cannot be an empty field`,
                    'any.required': `"Plan Type" is a required field`,
                }),
            plan_type_area: Joi.string().allow('').trim().valid(SUBSCRIPTION_PLAN_TYPE_AREA.metro, SUBSCRIPTION_PLAN_TYPE_AREA.non_metro).optional().messages({
                'string.empty': `"Plan Area" cannot be an empty field`,
                'any.required': `"Plan Area" is a required field`,
            }),
            plan_sub_type: Joi.string().allow('').trim().valid(SUBSCRIPTION_PLAN_SUB_TYPE.classified, SUBSCRIPTION_PLAN_SUB_TYPE.hot_vacancy).optional(),
            job_boosting: Joi.string().trim().valid(BOOSTING_TYPE.All_State, BOOSTING_TYPE.No, BOOSTING_TYPE.One_State).optional().allow(''),

            connected_free_metro_plan_id: Joi.number().optional(),
            connected_free_non_metro_plan_id: Joi.number().optional(),

            email_limit: Joi.number().optional(),
            cv_limit: Joi.number().optional(),
            job_boosting_days: Joi.number().optional(),
            ref_amount_earned: Joi.number().optional(),
            cashback_amount: Joi.number().optional()
        })

        const {
            error
        } = schema.validate(data)

        if (error) {
            console.log("error ::", error);
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
        } else {

            console.log(" :: data :: ", data);
            SubscriptionPlan.findOrCreate({
                    where: {
                        title: data.title,
                        description: data.description,
                        amount: data.amount,
                        expiry_days: data.expiry_days,
                        user_role_type: data.user_role_type,
                        status: data.status,
                        offer: data.offer,
                        offer_type: data.offer_type,
                        discounted_amount: data.discounted_amount,
                        job_limit: data.job_limit,
                        description_limit: data.description_limit,
                        plan_type: data.plan_type,
                        plan_type_area: data.plan_type_area,
                        plan_sub_type: data.plan_sub_type,
                        job_boosting: data.job_boosting,
                        connected_free_metro_plan_id: data.connected_free_metro_plan_id ? data.connected_free_metro_plan_id : null,
                        connected_free_non_metro_plan_id: data.connected_free_non_metro_plan_id ? data.connected_free_non_metro_plan_id : null,
                        email_limit: data.email_limit,
                        cv_limit: data.cv_limit,
                        job_boosting_days: data.job_boosting_days,
                        ref_amount_earned: data.ref_amount_earned ? data.ref_amount_earned : 0,
                        cashback_amount: data.cashback_amount ? data.cashback_amount : 0,
                    },
                })
                .then((createdPlan) => {
                    console.log(createdPlan);
                    const boolean = createdPlan[1];
                    if (boolean === true) {
                        req.flash("success", "Plan created sucessfully !");
                        res.redirect('/admin/subscription-plans')
                    } else {
                        req.flash("error", "Plan Already Exists !");
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    console.log(" ::: err :: ", err);
                    req.flash('error', 'please check your network connection !');;
                    res.redirect(req.header('Referer'))
                });

        }
    },

    UpdateSubscriptionPlanP: async(req, res) => {
        const id = req.params.id
        await SubscriptionPlan.findByPk(id)
            .then((alldata) => {
                Role.findAll()
                    .then(function(allRoles) {
                        res.render('admin/SubscriptionPlans/update_subscription', {
                            alldata,
                            allRoles
                        })
                    })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    UpdateSubscritionPlan: async(req, res) => {
        const id = req.params.id
        const data = req.body;
        const schema = Joi.object({
            title: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Title" cannot be an empty field`,
                    'any.required': `"Title" is a required field`,
                }),
            description: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Description" cannot be an empty field`,
                    'any.required': `"Description" is a required field`,
                }),
            amount: Joi.string().trim().required()
                .messages({
                    'string.empty': `"Amount" cannot be an empty field`,
                    'any.required': `"Amount" is a required field`,
                }),
            expiry_days: Joi.number().required()
                .messages({
                    'string.empty': `"Expiry days" cannot be an empty field`,
                    'any.required': `"Expiry days" is a required field`,
                }),
            user_role_type: Joi.string().trim().required()
                .messages({
                    'string.empty': `"User role type " cannot be an empty field`,
                    'any.required': `"User role type " is a required field`,
                }),
            status: Joi.any().required()
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            req.flash('formValue', data);
            res.redirect(req.header('Referer'))
            console.log('Something went wrong', error);
        } else {
            await SubscriptionPlan.update(data, {
                    where: {
                        id: id,
                    }
                })
                .then((plan) => {
                    req.flash('success', 'Plan Updated sucessfully !');
                    res.redirect('/admin/subscription-plans')
                })
                .catch((error) => {
                    req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                    res.redirect(req.header('Referer'))
                })
        }
    },

    DeleteSubscriptionPlan: async(req, res) => {
        const id = req.params.id
        SubscriptionPlan.update({
                status: '2'
            }, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('error', 'Plan deleted successfully !');
                res.redirect(req.header('Referer'))
            })
            .catch((err) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })
    },

    SubscribedUsers: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        const id = req.params.id
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                plan_id: id,
                start_date: {
                    [Op.ne]: null
                },
                expiry_date: {
                    [Op.ne]: null
                }
            },
            offset: offset,
            limit: limit,
            include: [{
                    model: User,
                    as: 'subscribed_user'
                },
                {
                    model: SubscriptionPlan
                }
            ]

        };
        if (limit) options['limit'] = limit;


        await SubscribedUser.findAndCountAll(options)

        .then((data) => {
                // return res.send(data)
                if (!data.rows.length) {
                    res.render("admin/SubscriptionPlans/subscribedUsers", {
                        message,
                        error: 'No Data Found',
                        data,
                        extra: '',
                        pageNo,
                        moment,
                        limit,
                        id
                    });
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    console.log("subscription plan subscribed user data");
                    console.log(data.rows[0].subscribed_user[0].name);
                    res.render('admin/SubscriptionPlans/subscribedUsers', {
                        data,
                        extra,
                        pageNo,
                        limit,
                        moment,
                        message,
                        error,
                        id,
                    })
                }
            })
            .catch((e) => {
                console.log("console tag of subscribed users data");
                console.log(e);
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })
    },
}