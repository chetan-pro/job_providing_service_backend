const {
    Op
} = require("sequelize");
const axios = require('axios').default;
const {
    USER_ROLE_TYPE,
    DELETE,
    limit,
    offset
} = require('../../services/Constants');
const moment = require('moment');
const path = require("path");
const util = require('util')
const fs = require('fs');
const writeFileAsync = util.promisify(fs.writeFile)
const puppeteer = require('puppeteer')
const chromeEval = require('chrome-page-eval')({
    puppeteer,
    // launchOptions: {
    //     args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote']
    // }
})


const conversionFactory = require('html-to-xlsx')

const Helper = require('../../services/Helper');
var pdf = require('html-pdf');

const Sequelize = require('sequelize');
const {
    User,
    state,
    city,
    Industry,
    UserSkill,
    SkillSubCategory,
    Education,
    EducationData,
    SubscribedUser,
    SubscriptionPlan,
    UserRoles,
    WalletSettlements,
    TransactionHistory,
    currentBussiness,
    WalletTransactions,
    resume_education,
    resume_experience,
    resume_skills,
    resume_hobbies,
    resume_reference,
    resume
} = require("../../models");

module.exports = {



    candidatePdfView: async(req, res) => {
        try {
            var {
                search,
                status,
                state_id,
                education_id,
                subscription_status,
                pin_code,
                industry_id,
                by_date
            } = req.query;

            let options = {
                where: {
                    user_role_type: req.params.roleType
                },
                include: [{
                        model: city,
                        attributes: ["id", "name"],
                    },
                    {
                        model: state,
                        attributes: ["id", "name"],
                    },
                    {
                        model: Industry,
                        attributes: ["id", "name"],
                    },
                    {
                        model: Industry,
                    },
                    {
                        model: UserSkill,
                        attributes: ["skill_sub_category_id"],
                        include: {
                            model: SkillSubCategory,
                            attributes: ["id", "name", "skill_category_id"],
                        },
                    },
                ]
            };

            if (by_date) {
                options['where']['createdAt'] = {
                    [Op.gt]: `%${by_date}%`
                }
            }
            if (state_id) {
                options['where']['state_id'] = {
                    [Op.like]: `%${state_id}%`
                }
            }
            if (education_id) {
                options['include'] = [...options['include'], {
                    model: Education,
                    where: {
                        education_id
                    },
                    include: [{ model: EducationData }]
                }]
            } else {
                options['include'] = [...options['include'], {
                    model: Education,
                    include: [{ model: EducationData, required: false }],
                    required: false
                }]
            }
            if (pin_code) {
                options['where']['pin_code'] = {
                    [Op.like]: `%${pin_code}%`
                }
            }
            if (industry_id) {
                options['where']['industry_id'] = {
                    [Op.like]: `%${industry_id}%`
                }
            }
            if (search) {
                options['where']['name'] = {
                    [Op.like]: `%${search}%`
                }
            }

            if (subscription_status == '0') {
                options['include'] = [...options['include'], {
                    model: SubscribedUser,
                    include: [{ model: SubscriptionPlan }],
                    where: {
                        expiry_date: {
                            [Op.gt]: Date.now()
                        },
                    }
                }]
            } else if (subscription_status == '1') {
                options['include'] = [...options['include'], {
                    model: SubscribedUser,
                    where: {
                        expiry_date: {
                            [Op.lt]: Date.now()
                        }
                    },
                    include: [{ model: SubscriptionPlan }]
                }]
            } else {
                options['include'] = [...options['include'], {
                    model: SubscribedUser,
                    include: [{
                        model: SubscriptionPlan
                    }]
                }]
            }
            if (status) {
                options['where']['status'] = {
                    [Op.like]: `%${status}%`
                }
            }
            return await User.findAll(options).then((data) => {
                return res.render('admin/PdfViews/candidate_pdf.ejs', {
                    data,
                    role: req.params.roleType
                })
            }).catch((e) => {
                return res.render('admin/PdfViews/candidate_pdf.ejs', {
                    data: [],
                    role: req.params.roleType
                })
            });
        } catch (e) {
            return res.render('admin/PdfViews/candidate_pdf.ejs', {
                data: [],
                role: req.params.roleType
            })
        }
    },

    candidateDownloadPdf: async(req, res) => {
        let str = '';
        for (const key in req.query) {
            str = str + `${key}=${req.query[key]}&`;
        }

        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/candidate-pdf-view/${req.params.roleType}?${str}`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },

    candidateWalletPdfView: async(req, res) => {
        console.log("i am in pdf view");
        try {
            const id = req.params.id
            const options = {
                where: {
                    user_id: id
                },
            };
            await WalletTransactions.findAndCountAll(options)
                .then((data) => {
                    console.log('chetan data', data);
                    return res.render('admin/PdfViews/candidate_wallet_pdf.ejs', {
                        data,
                    })
                }).catch((e) => {
                    console.log('chetan error', e);
                    return res.render('admin/PdfViews/candidate_wallet_pdf.ejs', {
                        data: [],
                    })
                });
        } catch (e) {
            console.log('chetan catch error', e);
            return res.render('admin/PdfViews/candidate_wallet_pdf.ejs', {
                data: [],
            })
        }
    },

    candidateWalletPdf: async(req, res) => {
        let str = '';
        for (const key in req.query) {
            str = str + `${key}=${req.query[key]}&`;
        }
        console.log("untill this everything good");
        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/candidate-wallet-pdf-view/${req.params.id}`).catch((e) => console.log(e));
        console.log("untill this now everything good");
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            console.log('chetan yaha tk agye');
            console.log(html);
            console.log(html.data);
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },


    billClaimViewPdf: async(req, res) => {
        try {
            let whereOptions = {
                status: {
                    [Op.ne]: DELETE
                },
            }
            whereOptions['admin_approved'] = 1;
            whereOptions['user_role_type'] = {
                [Op.eq]: [USER_ROLE_TYPE.business_correspondence]
            };
            WalletSettlements.findAndCountAll({
                include: [{
                    model: User,
                    where: whereOptions,
                }],
                limit: limit,
                offset: offset,
            }).then(statedata => {
                console.log("sdkvmslvfvvf");

                console.log("sdkvmslv2333");

                console.log(statedata);
                if (statedata.count === 0) {
                    return res.render('admin/PdfViews/bill_table_pdf.ejs', {
                        data: [],
                        role: 'Bill Claim',
                        moment
                    })
                }
                return res.render('admin/PdfViews/bill_table_pdf.ejs', {
                    data: statedata,
                    moment,
                    role: 'Bill Claim',
                })
            })
        } catch (e) {
            console.log("sdddddddddddddesddddddddddddddddddddddddddddddd");
            console.log(e);
        }
    },

    billClaimDownloadPdf: async(req, res) => {
        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/bill-claim-view`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },

    resumeViewPdf: async(req, res) => {
        try {
            console.log("resume query");
            console.log(req.query);
            const { download_details, pin_code, designation, experience, state_id, city_id, Skills_id } = req.query;

            var arr = [{
                    model: User
                },
                {
                    model: resume_education,
                    required: false,
                },
                {
                    model: resume_experience,
                    required: false,
                },
                {
                    model: resume_skills,
                    required: false,
                    include: [{
                        model: SkillSubCategory,
                        where: {}
                    }],

                },
                {
                    model: resume_hobbies,
                    required: false,

                },
                {
                    model: resume_reference,
                    required: false,
                },
                {
                    model: city,
                    attributes: ["id", "name"],
                    required: false,
                    where: {}

                },
                {
                    model: state,
                    attributes: ["id", "name"],
                    required: false,
                    where: {}
                },
            ];

            let resumeOptions = {
                include: arr,

                where: {}
            }


            pin_code ? resumeOptions['where']['pin_code'] = pin_code : '';
            designation ? resumeOptions['where']['designation'] = {
                [Op.like]: `%${designation}%`
            } : '';
            experience === '0' ? arr[2]['required'] = true : '';
            state_id ? resumeOptions['where']['state_id'] = state_id : '';
            city_id ? resumeOptions['where']['city_id'] = city_id : '';

            if (Skills_id) {
                arr[3]['include'][0]['where']['skill_category_id']
                arr[3]['required'] = true
            }
            await resume.findAndCountAll(resumeOptions).then(statedata => {

                if (statedata.count === 0) {
                    return res.render('admin/PdfViews/resume_pdf.ejs', {
                        data: [],
                    })
                }
                return res.render('admin/PdfViews/resume_pdf.ejs', {
                    data: statedata,
                })
            })
        } catch (e) {
            console.log("sdddddddddddddesddddddddddddddddddddddddddddddd");
            console.log(e);
        }
    },

    resumeDownloadPdf: async(req, res) => {
        let str = '';
        for (const key in req.query) {
            str = str + `${key}=${req.query[key]}&`;
        }
        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/resume-view?${str}`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },

    commissionDetailsOfBusinessPartnerView: async(req, res) => {
        try {
            let options = {
                include: [{ model: currentBussiness, required: true }, { model: WalletTransactions }],
                where: { user_role_type: [USER_ROLE_TYPE.business_correspondence, USER_ROLE_TYPE.cluster_manager, ] },
                attributes: ["id", "name", "user_role_type", [
                        Sequelize.literal(`(
                            SELECT COUNT(id)
                            FROM user_referral
                            where user_referral.user_id=User.id
                        )`),
                        'total_registrees'
                    ],
                    [
                        Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "JS"
                )`),
                        'registrees_js_currently_on_subscription'
                    ],
                    [
                        Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "HSP"
                )`),
                        'registrees_hsp_currently_on_subscription'
                    ],

                    [
                        Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "HSS"
                )`),
                        'registrees_hss_currently_on_subscription'
                    ],

                    [
                        Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "LH"
                )`),
                        'registrees_lh_currently_on_subscription'
                    ],

                    [
                        Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "COMPANY"
                )`),
                        'registrees_company_currently_on_subscription'
                    ],
                ]
            }
            User.findAndCountAll(options)
                .then((data) => {
                    if (data.rows.length > 0) {
                        return res.render('admin/PdfViews/business_partner_all_commission_details.ejs', {
                            data,
                        })
                    } else {
                        res.render('admin/PdfViews/business_partner_all_commission_details.ejs', {
                            data,
                        })
                    }
                })
        } catch (e) {
            console.log("sdddddddddddddesddddddddddddddddddddddddddddddd");
            console.log(e);
        }
    },

    commissionDetailsOfBusinessPartnerDownloadPdf: async(req, res) => {
        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/business-partner-commission-details-view`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },

    commissionDetailsView: async(req, res) => {
        try {
            let query = {
                user_id: req.params.id,
                reason: "Commission",
            }
            let options = {
                where: query,
                attributes: ["id", ["details", "Reason"],
                    ["createdAt", "date"],
                    ["amount", "my_commission_amount"]
                ]
            }
            WalletTransactions.findAndCountAll(options)
                .then((data) => {
                    if (data.rows.length > 0) {
                        return res.render('admin/PdfViews/commission_details_pdf.ejs', {
                            data,
                        })
                    } else {
                        return res.render('admin/PdfViews/commission_details_pdf.ejs', {
                            data,
                        })
                    }
                })

        } catch (e) {
            return res.render('admin/PdfViews/commission_details_pdf.ejs', {
                data: { rows: [] },
            })
        }
    },

    commissionDetailsDownloadPdf: async(req, res) => {
        const html = await axios.get(`https://hindustaanjobs.com/admin/commission-details-view/${req.params.id}`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },




    subscriptionDetailsViewPdf: async(req, res) => {
        const {
            id
        } = req.params;
        var {
            search,
            sortBy,
            status
        } = req.query
        let limit = null;
        let sorting = [
            ["id", sortBy != null ? sortBy : "ASC"]
        ];

        const options = {
            order: sorting,

            where: {
                user_id: id
            },
            include: [{
                model: SubscribedUser,
                where: {},
                include: [{
                    model: SubscriptionPlan,
                }, ]
            }, ],

        };




        if (limit) options["limit"] = limit;
        await TransactionHistory.findAndCountAll(options)
            .then((data) => {
                console.log(data.rows);
                if (data.count === 0) {
                    return res.render('admin/PdfViews/subscription_details_table_pdf.ejs', {
                        data,
                        moment,
                    })
                } else {
                    return res.render('admin/PdfViews/subscription_details_table_pdf.ejs', {
                        data,
                        moment,
                    })
                }
            })
            .catch((e) => {
                console.log(e)
                return res.render('admin/PdfViews/subscription_details_table_pdf.ejs', {
                    data: { rows: [{ SubscribedUsers: [] }] },
                    moment,
                })
            })
    },
    subscriptionDetailsDownloadPdf: async(req, res) => {
        const {
            id
        } = req.params;
        const html = await axios.get(`https://admin.hindustaanjobs.com/admin/subscription-details-view/${id}`).catch((e) => console.log(e));
        if (req.query.type) {
            const stream = await conversion(html.data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            stream.pipe(res);
        } else {
            pdf.create(html.data).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    },
}
const conversion = conversionFactory({
    extract: async({ html, ...restOptions }) => {


        const tmpHtmlPath = path.join(__dirname, './test.html')

        await writeFileAsync(tmpHtmlPath, html)

        const result = await chromeEval({
            ...restOptions,
            html: tmpHtmlPath,
            scriptFn: conversionFactory.getScriptFn()
        })



        const tables = Array.isArray(result) ? result : [result]

        return tables.map((table) => ({
            name: table.name,
            getRows: async(rowCb) => {
                table.rows.forEach((row) => {
                    rowCb(row)
                })
            },
            rowsCount: table.rows.length
        }))
    }
});