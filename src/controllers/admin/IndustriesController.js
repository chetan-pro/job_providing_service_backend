const {
    Op,
    Sequelize
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    Industry,
    User,
    JobPost,
    SubscribedUser,
    UserReferral
} = require("../../models");
const { DELETE, ACTIVE } = require("../../services/Constants");

module.exports = {

    dashboard: async(req, res) => {
        let dets = await User.count({
            attributes: [
                [
                    Sequelize.literal(`(
                        SELECT roleType FROM user_roles WHERE user_roles.userId = User.id ORDER BY user_roles.createdAt ASC limit 1
                        )`),
                    'userRoleTableRole'
                ],

            ],
            group: ["userRoleTableRole"],
        });

        let activeAccountDets = await User.count({
            where: {
                status: 1
            },
            attributes: [
                [
                    Sequelize.literal(`(
                        SELECT roleType FROM user_roles WHERE user_roles.userId = User.id ORDER BY user_roles.createdAt ASC limit 1
                        )`),
                    'userRoleTableRole'
                ],

            ],
            group: ["userRoleTableRole"],
        });

        let activeDets = await User.count({
            include: [{
                model: SubscribedUser,
                where: {
                    expiry_date: {
                        [Op.gt]: Date.now()
                    }
                },
                required: true
            }, ],
            attributes: [
                [
                    Sequelize.literal(`(
                        SELECT roleType FROM user_roles WHERE user_roles.userId = User.id ORDER BY user_roles.createdAt ASC limit 1
                        )`),
                    'userRoleTableRole'
                ],

            ],
            group: ["userRoleTableRole"],
        });
        let now = new Date()
        console.log('Today: ' + now.toUTCString())
        let last30days = new Date(now.setDate(now.getDate() - 30))
        let referralDets = await User.count({
            where: {
                user_role_type: ['BC', 'FSE', 'ADVISOR', 'CM'],

            },
            include: [{
                model: UserReferral,
                where: {
                    createdAt: {
                        [Op.gt]: last30days
                    }
                },
                required: true
            }],
            group: ["user_role_type"],
        });
        let countTotal = await User.count();
        dets.forEach((value) => {
            let obj = activeDets.find((d) => d.userRoleTableRole == value.userRoleTableRole);
            if (obj) {
                value['profile_active'] = obj.count;
            }
        });
        dets.forEach((value) => {
            let obj = referralDets.find((d) => d.userRoleTableRole == value.userRoleTableRole);
            if (obj) {
                value['profile_active'] = obj.count;
            }
        });
        dets.forEach((value) => {
            let obj = activeAccountDets.find((d) => d.userRoleTableRole == value.userRoleTableRole);
            if (obj) {
                value['account_active'] = obj.count;
                value['account_inactive'] = value.count - obj.count;
            }
        });
        // return res.send(dets);
        let subscription = await User.count({
            include: [{
                model: SubscribedUser,
                where: {
                    expiry_date: {
                        [Op.gt]: Date.now()
                    }
                }
            }, ],
            group: ['user_role_type'],
        });

        let jobPostCount = await JobPost.count({
            where: {
                status: ACTIVE
            },
            group: ['job_type_id']
        })
        console.log("::::::::::::::::::::::::::{ data: dets, jobPostCount }:::::::::::::::::::::::::::");
        console.log({ data: dets, jobPostCount });


        let arr = [{
            model: User,
            as: 'subscribed_user',
        }];
        let options = {
            order: [
                ['id', 'DESC']
            ],
            include: arr,
            attributes: [],
            group: ["userRoleTableRole"]
        }

        // registrees_currently_on_subscription , new_registrees_added_last_month
        options.attributes.push(
            [
                Sequelize.literal(`(
                SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_user.id ORDER BY user_roles.createdAt ASC limit 1
            )`),
                'userRoleTableRole'
            ], [

                Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(subscribed_users.user_id))
                    FROM subscribed_users
                    where  (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = userRoleTableRole
                )`),
                'registrees_currently_on_subscription'
            ], [
                Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(subscribed_users.user_id))
                    FROM subscribed_users
                    where date_add(subscribed_users.createdAt,INTERVAL 30 day)>now() AND  (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = userRoleTableRole
                )`),
                'new_registrees_added_last_month'
            ]
        );

        await SubscribedUser.count(options)
            .then((data) => {
                res.render("admin/dashboard.ejs", { data: dets, registered: data, jobPostCount });
            });
    },

    industry: async(req, res) => {

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
                [Op.not]: [
                    { status: DELETE },
                ]
            },
            order: sorting,
            offset: offset,
            limit: limit,
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }
        await Industry.findAndCountAll(options)
            .then((data) => {

                if (data.count === 0) {
                    res.render('admin/Industries/industries.ejs', {
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
                    res.render('admin/Industries/industries.ejs', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message: '',
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

    industry_create: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/Industries/create_industries", {
            formValue,
            message,
            error
        });
    },

    add_industry_create: async(req, res) => {
        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().trim().required().alphanum(),
            status: Joi.string().trim().required()
        })
        const {
            error
        } = await schema.validate(reqParams)

        if (error) {
            // return res.send(error)
            req.flash('formValue', reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            Industry.findOrCreate({
                    where: {
                        name: reqParams.name,
                        status: reqParams.status
                    },
                })
                .then((Industrydata) => {
                    const boolean = Industrydata[1];
                    if (boolean) {
                        req.flash('formValue', reqParams);
                        req.flash('success', 'Industry created sucessfully !');
                        res.redirect('/admin/industry')
                    } else {
                        req.flash('formValue', reqParams);
                        req.flash('error', 'Industry Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });

        }
    },

    industry_updateP: async(req, res) => {
        const formValue = req.flash('formValue')[0];
        const error = req.flash('error')
        const message = req.flash('success')

        const id = req.params.id
        await Industry.findByPk(id, {
                where: {
                    [Op.not]: [
                        { status: DELETE },
                    ]
                },
            })
            .then((alldata) => {
                res.render('admin/Industries/update_industries', {
                    alldata,
                    formValue,
                    error,
                    message
                })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    industry_update: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required().alphanum(),
            status: Joi.string().required()
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await Industry.update(data, {
                    where: {
                        id: id
                    }
                })
                .then((industriesdata) => {
                    req.flash('success', 'Industry Updated sucessfully !');
                    res.redirect('/admin/industry')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    industry_delete: async(req, res) => {

        const id = req.params.id

        let data = { status: 2 }
        Industry.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Industry Deleted sucessfully !');
                res.redirect('/admin/industry')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('backURL')
            })
    },
};