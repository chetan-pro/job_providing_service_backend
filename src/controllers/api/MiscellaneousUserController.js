const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");

const {
    SUCCESS,
    FAIL,
    BAD_REQUEST,
    YES,
    NO,
    INTERNAL_SERVER,
    USER_ROLE_TYPE,
    APPROVED


} = require("../../services/Constants");
const Joi = require("@hapi/joi");
const moment = require("moment");
const path = require("path");

const { userInfo, currentBussiness, User, UserReferral, SubscribedUser, WalletTransactions, SubscriptionPlan, city, state, UserRoles } = require("../../models");
const { number } = require("@hapi/joi");

module.exports = {

    // personal Details
    AddMiscellaneousUserPersonalDetails: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const { authUserId } = req;

        const reqObj = {
            residence_no: Joi.string().length(10).pattern(/^[0-9]+$/),
            office_no: Joi.string().length(10).pattern(/^[0-9]+$/),
            whatsapp_no: Joi.string().length(10).pattern(/^[0-9]+$/),
            pan_no: Joi.string().required(),
            adhar_no: Joi.string().required(),
            relative_relation: Joi.string().required(),
            realtive_name: Joi.string().required(),
            current_status: Joi.string().required(),
            education_qualification: Joi.string().required(),
            residential_proof_name: Joi.string().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Basic Details validation", error))
            );
        } else {

            let detailExist = await userInfo.findOne({
                where: {
                    user_id: authUserId
                }
            }).catch(e => console.log(e))

            if (detailExist) {
                return Response.errorResponseData(
                    res,
                    res.__("Details already Exist")
                );
            }

            let imgArray = [fields.adhar_img_front, fields.adhar_img_back, fields.pan_img_front, fields.pan_img_back, fields.residential_proof, fields.education_file];
            let imgNameArr = [];
            let imageName;
            for (var image of imgArray) {
                const extension = image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (image && (!imageExtArr.includes(extension))) {
                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }
                imageName = image ? `${image.name.split(".")[0]}${moment().unix()}${path.extname(image.name)}` : '';
                imgNameArr.push(imageName);
                Helper.ImageUploadMultiple(image, res, imageName);
            }

            // return;
            const userInfoObj = {
                residence_no: reqParam.residence_no,
                office_no: reqParam.office_no,
                whatsapp_no: reqParam.whatsapp_no,
                pan_no: reqParam.pan_no,
                adhar_no: reqParam.adhar_no,
                relative_relation: reqParam.relative_relation,
                realtive_name: reqParam.realtive_name,
                current_status: reqParam.current_status,
                adhar_img_front: imgNameArr[0],
                adhar_img_back: imgNameArr[1],
                pan_img_front: imgNameArr[2],
                pan_img_back: imgNameArr[3],
                residential_proof: imgNameArr[4],
                education_file: imgNameArr[5],
                education_qualification: reqParam.education_qualification,
                residential_proof_name: reqParam.residential_proof_name,
                user_id: authUserId,
            }

            await userInfo.create(userInfoObj)
                .then(async(result) => {
                    if (result) {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Basic details added successfully")
                        );
                    }
                }).catch((e) => {
                    console.log("error :;", e);
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                })
        }
    },

    // personal details
    EditDetailsMiscellaneousUserPersonalDetails: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const { authUserId } = req;
        console.log(" :: data in fields :: ,reqParam :: ", reqParam);
        let images;

        const reqObj = {
            residence_no: Joi.string().trim().min(10).max(10).required(),
            office_no: Joi.string().trim().min(10).max(10).required(),
            whatsapp_no: Joi.string().trim().min(10).max(10).required(),
            pan_no: Joi.string().required(),
            adhar_no: Joi.string().required(),
            relative_relation: Joi.string().required(),
            realtive_name: Joi.string().required(),
            current_status: Joi.string().required(),
            education_qualification: Joi.string().required(),
            residential_proof_name: Joi.string().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Bussiness Details validation", error))
            );
        } else {

            let FooundUserInfo = await userInfo.findOne({
                where: {
                    user_id: authUserId
                }
            })


            if (!FooundUserInfo) {
                return Response.errorResponseData(
                    res,
                    res.__("No Data Found")
                );
            }


            let nameArray = ['adhar_img_front', 'adhar_img_back', 'pan_img_front', 'pan_img_back', 'residential_proof']
            let imgArray = [fields.adhar_img_front, fields.adhar_img_back, fields.pan_img_front, fields.pan_img_back, fields.residential_proof];
            let imgNameArr = [];
            let imageName;
            let realValue;

            imgArray.forEach((image, index) => {
                if (image) {
                    let extension;
                    extension = image.type
                    const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                    if (image && (!imageExtArr.includes(extension))) {
                        return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    }
                    imageName = `${image.name.split(".")[0]}${moment().unix()}${path.extname(image.name)}`
                    imgNameArr.push(imageName);
                    Helper.ImageUploadMultiple(image, res, imageName)
                    realValue = nameArray[index]

                    Helper.RemoveImage(res, FooundUserInfo[realValue])
                } else {
                    imgNameArr.push(null);
                }
            })

            const userInfoObj = {
                residence_no: reqParam.residence_no,
                office_no: reqParam.office_no,
                whatsapp_no: reqParam.whatsapp_no,
                pan_no: reqParam.pan_no,
                adhar_no: reqParam.adhar_no,
                relative_relation: reqParam.relative_relation,
                realtive_name: reqParam.realtive_name,
                current_status: reqParam.current_status,
                education_qualification: reqParam.education_qualification,
                residential_proof_name: reqParam.residential_proof_name,
                adhar_img_front: imgNameArr[0] ? imgNameArr[0] : FooundUserInfo.adhar_img_front,
                adhar_img_back: imgNameArr[1] ? imgNameArr[1] : FooundUserInfo.adhar_img_back,
                pan_img_front: imgNameArr[2] ? imgNameArr[2] : FooundUserInfo.pan_img_front,
                pan_img_back: imgNameArr[3] ? imgNameArr[3] : FooundUserInfo.pan_img_back,
                residential_proof: imgNameArr[4] ? imgNameArr[4] : FooundUserInfo.residential_proof,
            }
            await userInfo.update(userInfoObj, {
                    where: {
                        user_id: authUserId
                    }
                })
                .then(async(result) => {
                    if (result) {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Bussiness details Updated successfully")
                        );
                    }
                }).catch((e) => {
                    console.log(":::: e::: ,", e);
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                })
        }

    },

    DeleteDetailsMiscellaneousUser: async(req, res) => {
        const { authUserId } = req;
        userInfo.destroy({
                where: {
                    user_id: authUserId
                }
            })
            .then(async(data) => {
                if (data) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Basic details Deleted successfully")
                    );
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("No data Found"),
                        SUCCESS
                    )
                }
            })
            .catch((err) => {
                console.log("error :;", e);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            })

    },

    GetDetailsMiscellaneousUserPersonalDetails: async(req, res) => {
        const { authUserId } = req;

        userInfo.findOne({
                where: {
                    user_id: authUserId
                }
            })
            .then(async(data) => {
                if (data) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Basic details found successfully")
                    );
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("No data Found"),
                        SUCCESS
                    )
                }
            })
            .catch((err) => {
                console.log("error :;", e);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            })
    },

    // Current-Bussiness-Occupation add/Edit
    AddMiscellaneousUserCurrentBussinessOccupationDetails: async(req, res) => {
        const fields = req.files;
        const reqParam = req.fields;
        const { authUserId } = req;

        let images;
        const reqObj = {
            current_bussiness: Joi.string().required(),
            bussiness_type: Joi.string().required(),
            bussiness_name: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            bussiness_years: Joi.string().required(),
            dimensions: Joi.string().required(),
            infrastructure_available: Joi.string().required(),
            current_income_pa: Joi.number().required(),
            no_customers: Joi.number().required(),
            pincode: Joi.string().required(),
            house_name: Joi.string().required(),
            street_no_name: Joi.string().required(),
            ward: Joi.string().required(),
            municipality: Joi.string().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Bussiness details validation", error))
            );
        } else {

            let BussinessDetilsUser = await currentBussiness.findOne({
                where: {
                    user_id: authUserId
                }
            })

            if (BussinessDetilsUser) {
                let imageName;
                if (fields.bussiness_img && fields.bussiness_img != '' && fields.bussiness_img.size > 0) {
                    let extension;
                    extension = fields.bussiness_img.type;
                    const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                    if (!imageExtArr.includes(extension)) {
                        return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    }
                    imageName = `${fields.bussiness_img.name.split(".")[0]}${moment().unix()}${path.extname(fields.bussiness_img.name)}`;
                    Helper.ImageUploadMultiple(fields.bussiness_img, res, imageName)
                    BussinessDetilsUser.bussiness_img ? Helper.RemoveImage(res, BussinessDetilsUser.bussiness_img) : '';
                }

                let bussinessObj = {
                    current_bussiness: reqParam.current_bussiness,
                    bussiness_type: reqParam.bussiness_type,
                    bussiness_name: reqParam.bussiness_name,
                    city_id: reqParam.city_id,
                    state_id: reqParam.state_id,
                    pincode: reqParam.pincode,
                    bussiness_img: imageName ? imageName : BussinessDetilsUser.bussiness_img,
                    dimensions: reqParam.dimensions,
                    bussiness_img: imageName,
                    infrastructure_available: reqParam.infrastructure_available,
                    current_income_pa: reqParam.current_income_pa,
                    no_customers: reqParam.no_customers,
                    house_name: reqParam.house_name,
                    street_no_name: reqParam.street_no_name,
                    ward: reqParam.ward,
                    municipality: reqParam.municipality,
                }

                await currentBussiness.update(bussinessObj, {
                        where: {
                            user_id: authUserId,
                        }
                    })
                    .then(async(result) => {
                        if (result) {
                            return Response.successResponseData(
                                res,
                                result,
                                SUCCESS,
                                res.locals.__("Bussiness details added successfully")
                            );
                        }
                    }).catch((e) => {
                        console.log(" ::: erorr ::: , ", e);
                        return Response.errorResponseData(
                            res,
                            res.__("Something went wrong")
                        );
                    })
            } else {

                let imageName;
                if (fields.bussiness_img && fields.bussiness_img.type) {
                    images = true;
                    const extension = fields.bussiness_img.type;
                    const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                    if (fields && fields.bussiness_img && (!imageExtArr.includes(extension))) {
                        return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    }
                    fields.image = fields.bussiness_img;
                    imageName = images ? `${fields.bussiness_img.name.split(".")[0]}${moment().unix()}${path.extname(fields.bussiness_img.name)}` : '';
                    Helper.ImageUpload(req, res, imageName)
                }

                const userInfoObj = {
                    current_bussiness: reqParam.current_bussiness,
                    bussiness_type: reqParam.bussiness_type,
                    bussiness_name: reqParam.bussiness_name,
                    city_id: reqParam.city_id,
                    state_id: reqParam.state_id,
                    pincode: reqParam.pincode,
                    bussiness_years: reqParam.bussiness_years,
                    dimensions: reqParam.dimensions,
                    bussiness_img: imageName,
                    infrastructure_available: reqParam.infrastructure_available,
                    current_income_pa: reqParam.current_income_pa,
                    no_customers: reqParam.no_customers,
                    user_id: authUserId,
                    house_name: reqParam.house_name,
                    street_no_name: reqParam.street_no_name,
                    ward: reqParam.ward,
                    municipality: reqParam.municipality,
                }

                await currentBussiness.create(userInfoObj)
                    .then(async(result) => {
                        if (result) {
                            return Response.successResponseData(
                                res,
                                result,
                                SUCCESS,
                                res.locals.__("Bussiness details added successfully")
                            );
                        }
                    }).catch((e) => {
                        console.log(" ::: erorr ::: , ", e);
                        return Response.errorResponseData(
                            res,
                            res.__("Something went wrong")
                        );
                    })
            }

        }
    },

    // CustomerDetails , add/Edit
    AddCustomerDetailsMiscellaneousUser: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req;

        const reqObj = {
            achievement1: Joi.string().optional(),
            achievement2: Joi.string().optional(),
            achievement3: Joi.string().optional(),
            ref1_name: Joi.string().required(),
            ref1_occupation: Joi.string().required(),
            ref1_address: Joi.string().required(),
            ref1_mobile: Joi.string().length(10).pattern(/^[0-9]+$/),
            ref2_name: Joi.string().optional(),
            ref2_occupation: Joi.string().optional(),
            ref2_address: Joi.string().optional(),
            ref2_mobile: Joi.string().length(10).pattern(/^[0-9]+$/),
            no_towns: Joi.number().required(),
            name_towns: Joi.string().required(),
            popular: Joi.string().valid(YES, NO).required(),
            customers_served: Joi.number().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Basic Details validation", error))
            );
        } else {

            let detailExist = await currentBussiness.findOne({
                where: {
                    user_id: authUserId
                }
            }).catch(e => console.log(e))

            // return;
            const userInfoObj = {
                achievement1: reqParam.achievement1,
                achievement2: reqParam.achievement2,
                achievement3: reqParam.achievement3,
                ref1_name: reqParam.ref1_name,
                ref1_occupation: reqParam.ref1_occupation,
                ref1_address: reqParam.ref1_address,
                ref1_mobile: reqParam.ref1_mobile,
                ref2_name: reqParam.ref2_name,
                ref2_occupation: reqParam.ref2_occupation,
                ref2_address: reqParam.ref2_address,
                ref2_mobile: reqParam.ref2_mobile,
                no_towns: reqParam.no_towns,
                name_towns: reqParam.name_towns,
                residential_address: reqParam.residential_address,
                popular: reqParam.popular,
                customers_served: reqParam.customers_served,
            }

            if (detailExist) {
                await currentBussiness.update(userInfoObj, {
                        where: {
                            user_id: authUserId
                        }
                    })
                    .then(async(result) => {
                        if (result) {
                            return Response.successResponseData(
                                res,
                                result,
                                SUCCESS,
                                res.locals.__("Bussiness details added successfully")
                            );
                        }
                    }).catch((e) => {
                        console.log("error :;", e);
                        return Response.errorResponseData(
                            res,
                            res.__("Something went wrong")
                        );
                    })

            } else {
                await currentBussiness.create(userInfoObj)
                    .then(async(result) => {
                        if (result) {
                            return Response.successResponseData(
                                res,
                                result,
                                SUCCESS,
                                res.locals.__("Basic details added successfully")
                            );
                        }
                    }).catch((e) => {
                        console.log("error :;", e);
                        return Response.errorResponseData(
                            res,
                            res.__("Something went wrong")
                        );
                    })
            }


        }
    },

    GetBussinessDetailsMiscellaneousUser: async(req, res) => {
        const { authUserId } = req;

        currentBussiness.findOne({
                where: {
                    user_id: authUserId
                },
                include: [{
                        model: state
                    },
                    {
                        model: city
                    },
                    {
                        model: User
                    }
                ]
            })
            .then(async(data) => {
                if (data) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Bussiness details found successfully")
                    );
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("No data Found"),
                        SUCCESS
                    )
                }
            })
            .catch((err) => {
                console.log("error :;", e);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            })
    },

    DeleteBussinessDetailsMiscellaneousUser: async(req, res) => {
        const { authUserId } = req;
        currentBussiness.destroy({
                where: {
                    user_id: authUserId
                }
            })
            .then(async(data) => {
                if (data) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Bussiness details Deleted successfully")
                    );
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("No data Found"),
                        SUCCESS
                    )
                }
            })
            .catch((err) => {
                console.log("error :;", e);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            })


    },

    // dashboard details (insider api's)
    GetDashboardDetails: async(req, res) => {
        const { authUserId } = req;

        let query = {
            ref_user_id: authUserId
        }

        let arr = [{
            model: User,
            as: 'registered_user',
        }]

        let options = {
            where: {
                ...query,
                literal: Sequelize.where(Sequelize.literal(`(
                    SELECT roleType FROM user_roles WHERE user_roles.userId = registered_user.id ORDER BY user_roles.createdAt ASC limit 1
                )`), '!=', 'BC')
            },
            order: [
                ['id', 'DESC']
            ],
            include: arr,
            attributes: [],
            group: ["userRoleTableRole"]
        }

        // registrees_currently_on_subscription , new_registrees_added_last_month
        // AND UserReferral.ref_user_id = ${authUserId}

        // [
        //     Sequelize.literal(`select (COUNT(UserReferral.id)) - (COUNT(DISTINCT(user_id)) FROM subscribed_users AS subscribed WHERE subscribed.user_id = UserReferral.user_id))`),
        //     'registrees_currently_not_on_subscription'
        // ]
        options.attributes.push(
            [
                Sequelize.literal(`(
                    SELECT roleType FROM user_roles WHERE user_roles.userId = registered_user.id ORDER BY user_roles.createdAt ASC limit 1
                )`),
                'userRoleTableRole'
            ], [
                Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_referral.user_id))
                    FROM subscribed_users
                    inner join user_referral on user_referral.user_id = subscribed_users.user_id
                    where user_referral.ref_user_id = ${authUserId} and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = userRoleTableRole
                )`),
                'registrees_currently_on_subscription'
            ], [
                Sequelize.literal(`(
                    SELECT date_add(registered_user.createdAt,INTERVAL 30 day) > now()  GROUP BY registered_user.user_role_type
                )`),
                'new_registrees_added_last_month'
            ], [
                `(select (count(UserReferral.id)) - (registrees_currently_on_subscription))`, 'registrees_currently_not_on_subscription'
            ]
        )



        // total commission
        let total_commission = await WalletTransactions.sum('amount', {
            where: {
                user_id: authUserId,
                reason: "Commission",
            }
        })
        var now = new Date();
        var day = ("0" + now.getDate()).slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);
        var today = now.getFullYear() + "-" + (month) + "-" + (day);

        console.log(new Date(today));
        // newCommission, 
        let newCommission = await WalletTransactions.findAll({
            where: {
                user_id: authUserId,
                reason: "Commission",
                createdAt: {
                    [Op.gt]: new Date(today)
                }
            },
            order: [
                ['id', 'DESC']
            ],
            attributes: [
                ["amount", "my_new_commission"]
            ]
        })

        // total_number_registrees
        let total_number_registrees = await UserReferral.count({
            where: {
                ref_user_id: authUserId,
            }
        })

        // total_Bussiness_correspondence
        let total_bussiness_correspondence = await UserReferral.count({
            where: {
                ref_user_id: authUserId,
            },
            include: [{
                model: User,
                required: true,
                as: 'registered_user',
                where: {
                    user_role_type: USER_ROLE_TYPE.business_correspondence
                }
            }]
        })

        // await UserReferral.findAll(options)
        await UserReferral.count(options)
            .then((data) => {
                data = {
                    data,
                    total_commission,
                    total_number_registrees,
                    total_bussiness_correspondence,
                    newCommission
                }

                if (data) {
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
            }, (e) => {
                console.log("error::", e);
                Response.errorResponseData(
                    res,
                    res.__(e),
                    INTERNAL_SERVER
                )
            })
    },

    registreeDetails: async(req, res) => {
        const { authUserId } = req;
        const { user_role_type, month, year, sortBy, page, user_id, status } = req.query

        let query = {
            ref_user_id: authUserId
        }

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;
        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy ? sortBy : 'DESC']
        ]

        let userIdRole;
        if (user_id) {

            userIdRole = await User.findOne({ where: { id: user_id } });
        }
        let referralUser = Sequelize.literal(`(
            (SELECT user_id FROM user_referral WHERE user_referral.ref_user_id = ${user_id}) 
        )`);
        let SingularOptions = {
            include: [{
                    model: User,
                    where: {
                        admin_approved: APPROVED
                    },
                    as: 'registered_by',
                    include: [{
                        model: WalletTransactions,
                        attributes: ["id", "user_id", ["amount", "my_commission"]],
                        include: [{
                            model: SubscribedUser,
                            where: {
                                user_id: {
                                    [Op.in]: userIdRole && (userIdRole.user_role_type == USER_ROLE_TYPE.business_correspondence || userIdRole.user_role_type == USER_ROLE_TYPE.cluster_manager || userIdRole.user_role_type == USER_ROLE_TYPE.field_sales_executive || userIdRole.user_role_type == USER_ROLE_TYPE.advisor) ? [referralUser] : [user_id]
                                },
                            },
                            attributes: ["id", "user_id", ["createdAt", "date"]],
                            include: [{
                                model: SubscriptionPlan,
                                attributes: [
                                    ["title", "subscription_purchased"],
                                    ["discounted_amount", "subscription_charge"]
                                ]
                            }]
                        }],
                        offset: offset,
                        order: sorting
                    }],
                    attributes: ["id"],
                },
                {
                    model: User,
                    as: "registered_user",
                    where: {
                        admin_approved: APPROVED
                    },
                    attributes: [
                        "id", [
                            Sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM subscribed_users AS subscribed
                                WHERE
                                subscribed.user_id = UserReferral.user_id
                                AND 
                                UserReferral.ref_user_id = ${authUserId}
                            )`),
                            'no_subscription_purchased'
                        ],
                        [
                            Sequelize.literal(`(
                                SELECT createdAt FROM subscribed_users AS subscribed
                                WHERE
                                subscribed.user_id = UserReferral.user_id
                                order by id desc limit 1
                            )`),
                            'last_subscription_purchase_date'
                        ],
                        ["user_role_type", "role_registered_for"],
                        ["createdAt", "date_registered"],
                        "image", "name", "mobile"
                    ]

                }
            ],
            attributes: ["user_id", "ref_user_id", "id"],
            where: {
                user_id: user_id,
                ref_user_id: authUserId,
            },
        }

        if (year) {
            query[Op.and] = [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('UserReferral.createdAt')), year)]
            SingularOptions.include[0].include[0]["where"][Op.and] = [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('registered_by.WalletTransactions.createdAt')), year)]
        }

        // year && month filter
        if (year && month) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('UserReferral.createdAt')), month))
            SingularOptions.include[0].include[0]["where"][Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('registered_by.WalletTransactions.createdAt')), month))
        }


        if (limit) SingularOptions.include[0].include[0]["limit"] = limit;

        console.log("  :: SingularOptions :: ", SingularOptions.where);

        // single User Details -
        if (user_id) {
            await UserReferral.findOne(SingularOptions)
                .then((data) => {
                    if (data) {
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
                }, (e) => {
                    console.log("error::", e);
                    Response.errorResponseData(
                        res,
                        res.__(e),
                        INTERNAL_SERVER
                    )
                })
        } else {
            let firstRoleQuery = Sequelize.literal(`(
                SELECT roleType FROM user_roles WHERE user_roles.userId = registered_user.id ORDER BY user_roles.createdAt ASC limit 1
            )`);
            let whereCondition = {};
            whereCondition = {
                admin_approved: APPROVED,
                literal: Sequelize.where(firstRoleQuery, '=', user_role_type),
            };
            if (status) {
                whereCondition[Op.and] = [status == 'active' ? Sequelize.literal('exists ( SELECT `user_id` FROM `subscribed_users` WHERE `subscribed_users`.`user_id` = `registered_user`.`id` )') : Sequelize.literal('not exists ( SELECT `user_id` FROM `subscribed_users` WHERE `subscribed_users`.`user_id` = `registered_user`.`id` )')]
            };

            let arr = [{
                model: User,
                as: 'registered_user',
                where: whereCondition,
                // where: [Sequelize.where(firstRoleQuery, '=', user_role_type), Sequelize.where(Sequelize.col('admin_approved'), '=', APPROVED)],
                attributes: ["name", "id", "user_role_type", "admin_approved", [
                    firstRoleQuery, 'userFirstRole'
                ]]
            }]

            let options = {
                where: query,
                subQuery: false,
                include: arr,
                attributes: ["id", ["createdAt", "date_registered"]],
                offset: offset,
                order: sorting
            }

            // if (user_role_type) arr[0]["where"]["userFirstRole"] = user_role_type;
            // if (user_role_type) arr[0]["where"] = Sequelize.where(Sequelize.col('userFirstRole'), '=', user_role_type);

            // no_subscription_purchased , last_subscription_purchase_date added
            options.attributes.push(
                [
                    Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM subscribed_users AS subscribed
                    WHERE
                    subscribed.user_id = UserReferral.user_id
                    AND 
                    UserReferral.ref_user_id = ${authUserId}
                )`),
                    'no_subscription_purchased'
                ], [
                    Sequelize.literal(`(
                    SELECT createdAt FROM subscribed_users AS subscribed
                    WHERE
                    subscribed.user_id = UserReferral.user_id
                    order by id desc limit 1
                )`),
                    'last_subscription_purchase_date'
                ]
            )

            await UserReferral.findAndCountAll(options)
                .then((data) => {
                    if (data) {
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
                }, (e) => {
                    console.log("error::", e);
                    Response.errorResponseData(
                        res,
                        res.__(e),
                        INTERNAL_SERVER
                    )
                })

        }

    },

    listOfCommission: async(req, res) => {

        const { authUserId } = req;

        const { month, year, sortBy, page } = req.query

        let query = {
            user_id: authUserId,
            reason: "Commission",
        }

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;
        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy ? sortBy : 'DESC']
        ]

        let options = {
            where: query,
            offset: offset,
            order: sorting,
            attributes: ["id", ["details", "Reason"],
                ["createdAt", "date"],
                ["amount", "my_commission_amount"]
            ]
        }

        if (limit) options["limit"] = limit;
        if (year) {
            query[Op.and] = [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('createdAt')), year)]
        }

        // year && month filter
        if (year && month) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('createdAt')), month))
        }

        WalletTransactions.findAndCountAll(options)
            .then((data) => {
                if (data) {
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
            })
            .catch((e) => {
                console.log("error::", e);
                Response.errorResponseData(
                    res,
                    res.__(e),
                    INTERNAL_SERVER
                )
            })

    }

}