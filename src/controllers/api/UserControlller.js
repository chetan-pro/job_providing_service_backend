const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Mailer = require("../../services/Mailer");
const Joi = require("@hapi/joi");
const moment = require("moment");
var validUrl = require("valid-url");
const URL = require("url").URL;
const path = require("path");
const Transformer = require("object-transformer");
let pluck = require('arr-pluck');

const {
    SUCCESS,
    DELETE,
    MALE,
    FEMALE,
    OTHER,
    ACTIVE,
    USER_IMAGE,
    USER_ROLE_TYPE,
    INTERNAL_SERVER,
    BAD_REQUEST,
    YES,
    NO,
    GlOBAL_CERTIFICATE_PATH,
    GlOBAL_IMAGE_PATH,
    USER_RESUME,
    FAIL
} = require("../../services/Constants");
const {
    ContactUs,
    User,
    state,
    city,
    Industry,
    UserSkill,
    UserLanguage,
    SkillCategory,
    SkillSubCategory,
    CompanyEnv,
    Permissons,
    UserRoles,
    ResumeAccessData
} = require("../../models");
const {
    profile,
    edit_profile,
} = require("../../transformers/api/UserTransformer");
module.exports = {
    /**
     * @description admin forgot password controller
     * @param req
     * @param res
     */
    Contact_us: async(req, res) => {
        const reqParam = req.body;
        const schema = Joi.object({
            first_name: Joi.string().trim().required(),
            last_name: Joi.string().trim().required(),
            email: Joi.string().trim().email().max(150).required(),
            description: Joi.string().trim().required(),
        });
        const { error } = await schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey("Contact us validation", error)
                )
            );
        } else {
            const userObj = {
                first_name: reqParam.first_name,
                last_name: reqParam.last_name,
                email: reqParam.email,
                description: reqParam.description,
            };
            await ContactUs.create(userObj)
                .then(async result => {
                    if (result) {
                        try {
                            // var msg = `<h1><b>Hii</b><br><br>I am ${
                            // 	reqParam.first_name + " " + reqParam.last_name
                            // }</h1><br><br><br> ${reqParam.description}`;
                            let locale = {
                                name: reqParam.first_name + " " + reqParam.last_name,
                                desc: reqParam.description,
                                appName: Helper.AppName
                            }
                            await Mailer.sendMail("tsettest262@gmail.com", 'Contact Us !', Helper.contactUs, locale);
                            return Response.successResponseData(
                                res,
                                null,
                                SUCCESS,
                                res.locals.__("Contact us password email send successfully")
                            );
                        } catch (e) {
                            Response.errorResponseData(
                                res,
                                e.message,
                                INTERNAL_SERVER
                            );
                        }
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
    },

    /**
     * @description My Profile
     * @param req
     * @param res
     */
    myProfile: async(req, res) => {
        const { authUserId } = req;
        await User.findOne({
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
                        model: UserSkill,
                        attributes: ["skill_sub_category_id"],
                        include: {
                            model: SkillSubCategory,
                            attributes: ["id", "name", "skill_category_id"],
                        },
                    },
                    {
                        model: Permissons
                    },
                    // {
                    // 	model : ResumeAccessData
                    // }
                ],
                where: {
                    id: authUserId,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            })
            .then(async userData => {
                if (userData) {

                    if (userData.image && userData.image != "" && !(userData.image.startsWith("https://"))) {
                        userData[
                            "image"
                        ] = `${GlOBAL_IMAGE_PATH}/${userData["image"]}`;
                    }
                    if (userData.resume && userData.resume != "") {
                        userData[
                            "resume"
                        ] = `${USER_RESUME}/${userData["resume"]}`;
                    }

                    const responseData = userData;

                    console.log(":::: dets ,.", userData.company_id);

                    const companyData = await User.findOne({
                        where: {
                            id: userData.company_id,
                            user_role_type: USER_ROLE_TYPE.company
                        },
                        include: [{
                                model: city,
                            },
                            {
                                model: state,
                            },
                        ]
                    })

                    console.log("::::data, ", companyData);
                    responseData.dataValues['companyData'] = await companyData;

                    return Response.successResponseData(
                        res,
                        responseData,
                        res.locals.__("Success")
                    );
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("User not available")
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
    },

    /**
     * @description Edit Profile
     * @param req
     * @param res
     */
    editProfile: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId, user_role_type } = req;
        let promise = [];
        let image;
        let resume;
        console.log(user_role_type);
        console.log("::::: req.firelds :::: ,", req.fields);

        //const DB_DATE_FORMAT = 'DD-MM-YYYY';
        const requestObj = {
            name: Joi.string().max(50).required(),
            gender: Joi.string().valid(MALE, FEMALE, OTHER).required(),
            dob: Joi.date().required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            state_id: Joi.string().required(),
            city_id: Joi.string().required(),
            address_line1: Joi.string().required(),
            address_line2: Joi.string().optional(),
            pin_code: Joi.string().required(),
            skill_sub_category_id: Joi.when(user_role_type, {
                is: USER_ROLE_TYPE.candidate,
                then: Joi.string().required(),
            }),
            image: Joi.string().optional(),
            resume: Joi.string().optional(),
            linkedIn_id: Joi.string().optional(),
            your_designation: Joi.string().optional(),
        };
        // const newData = moment(reqParam.dob).format(DB_DATE_FORMAT);
        const schema = Joi.object(requestObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey("Edit profile validation", error)
                )
            );
        } else {
            await User.findOne({
                    where: {
                        id: authUserId,

                        status: {
                            [Op.and]: [{
                                [Op.not]: DELETE,
                            }, {
                                [Op.eq]: ACTIVE
                            }]
                        },
                    },
                })
                // eslint-disable-next-line consistent-return
                .then(async userData => {
                    if (userData) {
                        console.log("errro of image");
                        if (req.files.image && req.files.image.size > 0) {
                            image = true;
                            const extension = req.files.image.type;
                            const imageExtArr = [
                                "image/jpg",
                                "application/octet-stream",
                                "image/jpeg",
                                "image/png",
                            ];
                            if (
                                req.files &&
                                req.files.image &&
                                !imageExtArr.includes(extension)
                            ) {
                                return Response.errorResponseData(
                                    res,
                                    res.__("Image invalid"),
                                    BAD_REQUEST
                                );
                            }
                        }
                        const imageName = image ?
                            `${moment().unix()}${path.extname(
									req.files.image.name
							  )}` :
                            "";

                        console.log(req.files);

                        if (req.files.resume && req.files.resume.size > 0) {
                            resume = true;
                            const extension = req.files.resume.type;
                            const imageExtArr = [
                                "application/octet-stream",
                                "application/pdf",
                            ];
                            if (
                                req.files &&
                                req.files.resume &&
                                !imageExtArr.includes(extension)
                            ) {
                                return Response.errorResponseData(
                                    res,
                                    res.__("Image invalid"),
                                    BAD_REQUEST
                                );
                            }
                        }
                        const resumeName = resume ?
                            `${moment().unix()}${path.extname(
									req.files.resume.name
							  )}` :
                            "";

                        const updateObj = {
                            name: reqParam.name,
                            gender: reqParam.gender,
                            dob: reqParam.dob,
                            mobile: reqParam.mobile ?
                                reqParam.mobile : userData.mobile,
                            state_id: reqParam.state_id,
                            city_id: reqParam.city_id,
                            address_line1: reqParam.address_line1,
                            address_line2: reqParam.address_line2,
                            pin_code: reqParam.pin_code,
                            image: imageName ? imageName : userData.image,
                            resume: resumeName ? resumeName : userData.resume,
                            linkedIn_id: reqParam.linkedIn_id,
                            your_designation: reqParam.your_designation
                        };
                        User.update(updateObj, {
                            where: { id: userData.id },
                        }).then(async(updateData, err) => {
                            if (updateData) {
                                if (image) {
                                    await Helper.ImageUpload(
                                        req,
                                        res,
                                        imageName
                                    );
                                }
                                if (resume) {
                                    await Helper.ResumeUpload(
                                        req,
                                        res,
                                        resumeName
                                    );
                                }

                                var arr = [{
                                        model: city,
                                        attributes: ["id", "name"],
                                    },
                                    {
                                        model: state,
                                        attributes: ["id", "name"],
                                    },
                                    {
                                        model: UserSkill,
                                        attributes: ["skill_sub_category_id"],
                                        include: {
                                            model: SkillSubCategory,
                                            attributes: [
                                                "id",
                                                "name",
                                                "skill_category_id",
                                            ],
                                        },
                                    },
                                ];

                                console.log(" ::: userData ::", userData.user_role_type);

                                if (userData.user_role_type == USER_ROLE_TYPE.candidate) {
                                    await UserSkill.destroy({
                                        where: { user_id: userData.id },
                                    }).then();
                                    let skill =
                                        await reqParam.skill_sub_category_id
                                        .split(",")
                                        .map(function(item) {
                                            return parseInt(item);
                                        });
                                    await skill.forEach(function(resultId) {
                                        promise.push(
                                            new Promise(
                                                async(resolve, reject) => {
                                                    var skillObj = {
                                                        user_id: userData.id,
                                                        skill_sub_category_id: resultId,
                                                        status: ACTIVE,
                                                    };
                                                    await UserSkill.create(
                                                        skillObj
                                                    ).then();
                                                    resolve(true);
                                                }
                                            )
                                        );
                                    });
                                }
                                Promise.all(promise).then(async() => {
                                    const responseData = await User.findByPk(
                                        userData.id, { include: arr }
                                    );
                                    responseData.image = Helper.mediaUrl(
                                        USER_IMAGE,
                                        responseData.image
                                    );
                                    return Response.successResponseData(
                                        res,
                                        //new Transformer.Single(responseData, edit_profile).parse(),
                                        responseData,
                                        SUCCESS,
                                        res.locals.__(
                                            "User profile updated successfully"
                                        )
                                    );
                                });
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__("Something went wrong")
                                );
                            }
                        });
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not available")
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
    },
    /**
     * @description 'Change the status of is_user_available'
     * @param req
     * @param res
     */
    changeIsUserAvailable: async(req, res) => {
        const requestParams = req.body;
        const { authUserId } = req;
        const schema = Joi.object({
            is_user_available: Joi.string().valid(YES, NO).required(),
        });
        const { error } = await schema.validate(requestParams);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey(
                        "Is user available validation",
                        error
                    )
                )
            );
        } else {
            await User.findOne({
                    where: {
                        id: authUserId,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                })
                .then(async userData => {
                    if (userData) {
                        userData.is_user_available =
                            requestParams.is_user_available;
                        userData
                            .save()
                            .then(result => {
                                if (result) {
                                    Response.successResponseWithoutData(
                                        res,
                                        res.locals.__(
                                            "Is User Available Updated"
                                        ),
                                        SUCCESS
                                    );
                                } else {
                                    return Response.successResponseWithoutData(
                                        res,
                                        res.locals.__("No data found"),
                                        SUCCESS
                                    );
                                }
                            })
                            .catch(() => {
                                Response.errorResponseData(
                                    res,
                                    res.__("Internal error"),
                                    INTERNAL_SERVER
                                );
                            });
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not found"),
                            SUCCESS
                        );
                    }
                })
                .catch(() => {
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                });
        }
    },
    GetIsUserAvailable: async(req, res) => {
        const { authUserId } = req;
        await User.findOne({
            where: {
                id: authUserId,
                status: {
                    [Op.not]: DELETE,
                },
            },
            attributes: ["id", "is_user_available"],
        }).then(
            data => {
                if (data) {
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
            () => {
                Response.errorResponseData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                );
            }
        );
    },

    CreateDynamicLink: async(req, res) => {
        console.log(req.body);
        const { authUserId } = req;

        try {
            User.findByPk(authUserId)
                .then(async userData => {
                    console.log(":::::::::::::::::::userData:::::::::::::::::");
                    console.log(userData);
                    console.log("??????????????????userData????????????????");
                    const updateObj = {
                        share_link: await Helper.createDynamicLink(
                            userData.referrer_code
                        ),
                    };
                    await User.update(updateObj, {
                        where: {
                            id: authUserId,
                            status: {
                                [Op.not]: DELETE,
                            },
                        },
                    }).then(async data => {
                        return Response.successResponseData(
                            res,
                            updateObj,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    });
                })
                .catch(error => {
                    console.log(error);
                    return Response.successResponseData(
                        res,
                        error,
                        SUCCESS,
                        res.locals.__("Error")
                    );
                });
        } catch (error) {
            console.log("error");
            console.log(error);
            return Response.successResponseData(
                res,
                error,
                SUCCESS,
                res.locals.__("Error")
            );
        }
    },

    /**
     * @description 'This function is use to add fcm token.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    AddFcmToken: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req;
        console.log("add fcm token");
        console.log(reqParam);
        await User.findOne({
                where: {
                    id: authUserId,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            })
            .then(async userData => {
                if (userData) {
                    await User.update({ fcm_token: reqParam.fcm_token }, {
                            where: {
                                id: userData.id,
                            },
                        })
                        .then(async result => {
                            console.log(result)
                            if (result) {
                                Response.successResponseWithoutData(
                                    res,
                                    res.__("Fcm token added"),
                                    SUCCESS
                                );
                            }
                        })
                        .catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__("Internal error"),
                                INTERNAL_SERVER
                            );
                        });
                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__("User not available"),
                        FAIL
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

    },

};