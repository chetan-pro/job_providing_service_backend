const {
    Op
} = require("sequelize");
const Joi = require("@hapi/joi");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const moment = require("moment");
const path = require("path");
var pdf = require('html-pdf');

const pluck = require("arr-pluck")

const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    BAD_REQUEST,
    GlOBAL_IMAGE_PATH
} = require("../../services/Constants");

const {
    resume,
    resume_education,
    resume_experience,
    resume_skills,
    resume_hobbies,
    city,
    state,
    resume_reference,
    User,
    SkillSubCategory
} = require("../../models");

module.exports = {
    // show all details filled in resume
    show: async(req, res) => {


        const {
            page,
            sortBy,
            resume_id
        } = req.query;


        var arr = [{
                model: resume_education,
            },
            {
                model: resume_experience
            },
            {
                model: resume_skills,
                include: [{
                    model: SkillSubCategory
                }]
            },
            {
                model: resume_hobbies
            },
            {
                model: resume_reference
            },
            {
                model: city,
                attributes: ["id", "name"],
            },
            {
                model: state,
                attributes: ["id", "name"],
            },
        ];
        if (resume_id && resume_id != '') {
            await resume.findByPk(resume_id, {
                    include: arr,
                })
                .then(async data => {
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
                            res.locals.__("No resume found"),
                            FAIL
                        );
                    }
                })
                .catch((e) => {
                    console.log("error : :: ", e);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                })
        } else {
            let limit = 0;
            if (page) limit = 5;
            const pageNo = page && page > 0 ? parseInt(page, 10) : 5;

            const offset = (pageNo - 1) * limit;
            let sorting = [
                ['id', sortBy != null ? sortBy : 'ASC']
            ]

            const {
                authUserId
            } = req;


            const options = {
                include: arr,
                where: {
                    'user_id': authUserId,
                },
                offset: offset,
                order: sorting
            };
            if (limit) options['limit'] = limit;

            await resume
                .findOne(options)
                .then(
                    data => {
                        // console.log(data.service_provider_id);
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
                    err => {
                        console.log(err);
                        Response.errorResponseData(
                            res,
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                );
        }

    },

    // resume details
    create: async(req, res) => {
        console.log("create api called");

        const fields = req.files;
        const requestParam = req.fields;
        const {
            authUserId
        } = req

        let resumeExist = await resume.findOne({
            where: {
                user_id: authUserId
            }
        })

        if (resumeExist) {
            return Response.successResponseWithoutData(
                res,
                res.locals.__('Resume already exist')
            )
        }

        const reqObj = {
            name: Joi.string().optional(),
            designation: Joi.string().optional(),
            contact: Joi.string().optional(),
            email: Joi.string().optional(),
            about: Joi.string().optional(),
            description: Joi.string().optional(),
            address: Joi.string().optional(),
            pin_code: Joi.string().regex(/^[0-9]*$/).optional(),
            state_id: Joi.number().optional(),
            city_id: Joi.number().optional(),
            facebook: Joi.string().optional(),
            twitter: Joi.string().optional(),
            behance: Joi.string().optional(),
            instagram: Joi.string().optional(),
            linkedin: Joi.string().optional(),
            portfolio: Joi.string().optional(),
        }

        const schema = Joi.object(reqObj);
        console.log(schema)
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Resume validation", error))
            );
        } else {

            let imageName;
            if (fields.image) {
                let images = true;
                const extension = fields.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.image && (!imageExtArr.includes(extension))) {
                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }

                imageName = images ? `${fields.image.name.split('.')[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                await Helper.ImageUpload(req, res, imageName)
            }


            const resumeObj = {
                user_id: authUserId,
                name: requestParam.name,
                designation: requestParam.designation,
                about: requestParam.about,
                description: requestParam.description,
                contact: requestParam.contact,
                email: requestParam.email,
                image: imageName,
                address: requestParam.address,
                pin_code: requestParam.pin_code,
                state_id: requestParam.state_id,
                city_id: requestParam.city_id,
                facebook: requestParam.facebook,
                twitter: requestParam.twitter,
                behance: requestParam.behance,
                instagram: requestParam.instagram,
                linkedin: requestParam.linkedin,
                portfolio: requestParam.portfolio,
            };

            await resume.create(resumeObj)
                .then(async result => {
                    return Response.successResponseData(
                        res,
                        result,
                        SUCCESS,
                        res.locals.__("Resume Added Successfully")
                    );
                })
                .catch(e => {
                    console.log('201', e)
                    return Response.errorResponseData(
                        res,
                        res.__("somethingWentWrong")
                    );
                });
        }
    },

    updateResume: async(req, res) => {
        // const requestParam = req.body;
        const {
            authUserId
        } = req
        const fields = req.files;
        const requestParam = req.fields;
        const requestIdParam = req.params;
        const reqObj = {
            name: Joi.string().optional(),
            designation: Joi.string().optional(),
            contact: Joi.string().optional(),
            email: Joi.string().optional(),
            about: Joi.string().optional(),
            description: Joi.string().optional(),
            image: Joi.string().optional(),
            address: Joi.string().optional(),
            pin_code: Joi.string().regex(/^[0-9]*$/).optional(),
            state_id: Joi.number().optional(),
            city_id: Joi.number().optional(),
            facebook: Joi.string().optional(),
            twitter: Joi.string().optional(),
            behance: Joi.string().optional(),
            instagram: Joi.string().optional(),
            linkedin: Joi.string().optional(),
            portfolio: Joi.string().optional(),
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit resume validation', error))
            )
        } else {

            await resume.findOne({
                    where: {
                        user_id: authUserId,
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {
                    console.log('288', customData)
                    if (customData) {

                        let imageName;
                        if (fields.image) {
                            let images = true;
                            console.log('292', fields)
                            const extension = fields.image.type;
                            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                            if (fields && fields.image && (!imageExtArr.includes(extension))) {
                                return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                            }

                            imageName = images ? `${fields.image.name.split('.')[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';

                            Helper.ImageUpload(req, res, imageName);
                        }


                        const Obj = {
                            user_id: authUserId,
                            name: requestParam.name,
                            designation: requestParam.designation,
                            about: requestParam.about,
                            description: requestParam.description,
                            contact: requestParam.contact,
                            email: requestParam.email,
                            image: imageName,
                            address: requestParam.address,
                            pin_code: requestParam.pin_code,
                            state_id: requestParam.state_id,
                            city_id: requestParam.city_id,
                            facebook: requestParam.facebook,
                            twitter: requestParam.twitter,
                            behance: requestParam.behance,
                            instagram: requestParam.instagram,
                            linkedin: requestParam.linkedin,
                            portfolio: requestParam.portfolio,
                        }
                        resume.update(Obj, {
                            where: {
                                user_id: authUserId,
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            if (updateData) {
                                const Data = await resume.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('resume details update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async(err) => {
                            console.log(err)
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('resume details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    deleteResume: async(req, res) => {

        const {
            authUserId
        } = req;
        const requestParam = req.params;
        const resumeData = await resume.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume found'),
                FAIL
            )
        } else {
            resume.destroy({
                    where: {
                        user_id: authUserId,
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Resume deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete resume'),
                            FAIL
                        )
                    }
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

    // education details
    create_education: async(req, res) => {

        const requestParam = req.body;

        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            from: Joi.number().required(),
            to: Joi.number().required()
        }

        const schema = Joi.object(reqObj);
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Education Validation", error))
            );
        } else {
            if (requestParam.title && requestParam.title !== "") {
                const resumeObj = {
                    resume_id: requestParam.resume_id,
                    title: requestParam.title,
                    description: requestParam.description,
                    from: requestParam.from,
                    to: requestParam.to,
                };

                await resume_education.create(resumeObj)
                    .then(async result => {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Education added successfully")
                        );
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

    update_education: async(req, res) => {
        const requestParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            from: Joi.number().required(),
            to: Joi.number().required()
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit education resume validation', error))
            )
        } else {

            await resume_education.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            resume_id: requestParam.resume_id,
                            title: requestParam.title,
                            description: requestParam.description,
                            from: requestParam.from,
                            to: requestParam.to,
                        }
                        resume_education.update(Obj, {
                            where: {
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            console.log(updateData);
                            if (updateData) {
                                const Data = await resume_education.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Resume details update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Education details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    delete_education: async(req, res) => {

        const requestParam = req.params;
        const resumeData = await resume_education.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No education resume found'),
                FAIL
            )
        } else {
            resume_education.destroy({
                    where: {
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Education resume deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete education resume'),
                            FAIL
                        )
                    }
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

    // experience details
    create_experience: async(req, res) => {

        const requestParam = req.body;

        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            designation: Joi.string().required(),
            description: Joi.string().optional(),
            from: Joi.number().required(),
            to: Joi.number().required()
        }

        const schema = Joi.object(reqObj);
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Experience validation", error))
            );
        } else {
            if (requestParam.title && requestParam.title !== "") {
                const resumeObj = {
                    resume_id: requestParam.resume_id,
                    title: requestParam.title,
                    designation: requestParam.designation,
                    description: requestParam.description,
                    from: requestParam.from,
                    to: requestParam.to,
                };

                await resume_experience.create(resumeObj)
                    .then(async result => {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Experience added successfully")
                        );
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

    update_experience: async(req, res) => {
        const requestParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            designation: Joi.string().required(),
            description: Joi.string().optional(),
            from: Joi.number().required(),
            to: Joi.number().required()
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit experience resume validation', error))
            )
        } else {

            await resume_experience.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            resume_id: requestParam.resume_id,
                            title: requestParam.title,
                            designation: requestParam.designation,
                            description: requestParam.description,
                            from: requestParam.from,
                            to: requestParam.to,
                        }
                        resume_experience.update(Obj, {
                            where: {
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            console.log(updateData);
                            if (updateData) {
                                const Data = await resume_experience.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Experince details update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Experience details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    delete_experience: async(req, res) => {

        const requestParam = req.params;
        const resumeData = await resume_experience.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No experience resume found'),
                FAIL
            )
        } else {
            resume_experience.destroy({
                    where: {
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Experience resume deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete experience resume'),
                            FAIL
                        )
                    }
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

    // skills details
    create_skills: async(req, res) => {

        const requestParam = req.body;
        const reqObj = {
            resume_id: Joi.number().required(),
            skillSubCategory_id: Joi.number().required(),
            rating: Joi.number().min(0).max(10).required(),
        }

        const schema = Joi.object(reqObj);
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Skills validation", error))
            );
        } else {

            const resumeObj = {
                resume_id: requestParam.resume_id,
                skillSubCategory_id: requestParam.skillSubCategory_id,
                rating: requestParam.rating,
            };

            await resume_skills.create(resumeObj)
                .then(result => {
                    return Response.successResponseData(
                        res,
                        result,
                        SUCCESS,
                        res.locals.__("Skills added successfully")
                    );
                })
                .catch(e => {
                    console.log(e)
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                });

        }

    },

    update_skills: async(req, res) => {
        const requestParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
            resume_id: Joi.number().required(),
            skillSubCategory_id: Joi.number().required(),
            rating: Joi.number().min(0).max(10).required(),
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit skills resume validation', error))
            )
        } else {

            await resume_skills.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            resume_id: requestParam.resume_id,
                            skillSubCategory_id: requestParam.skillSubCategory_id,
                            rating: requestParam.rating,
                        }
                        resume_skills.update(Obj, {
                            where: {
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            if (updateData) {
                                const Data = await resume_skills.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Skills details updated successfully')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Skills details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    delete_skills: async(req, res) => {

        const requestParam = req.params;
        const resumeData = await resume_skills.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume skills found'),
                FAIL
            )
        } else {
            resume_skills.destroy({
                    where: {
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Resume skills deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete resume skills'),
                            FAIL
                        )
                    }
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

    // hobbies details
    create_hobbies: async(req, res) => {

        const requestParam = req.body;

        const reqObj = {
            resume_id: Joi.number().required(),
            hobbyName: Joi.string().required(),
        }

        const schema = Joi.object(reqObj);
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Hobby validation", error))
            );
        } else {
            if (requestParam.hobbyName && requestParam.hobbyName !== "") {

                let existingHobbies = await resume_hobbies.findAll({
                    where: {
                        resume_id: requestParam.resume_id
                    }
                })
                let existingId = pluck(existingHobbies, 'id');
                if (existingHobbies) {
                    resume_hobbies.destroy({
                        where: {
                            id: {
                                [Op.in]: existingId
                            }
                        }
                    })
                }

                let hobbies = requestParam.hobbyName.split(',');
                let resumeObj = [];
                hobbies.forEach(data => {
                    resumeObj.push({
                        resume_id: requestParam.resume_id,
                        hobbyName: data,
                    })
                })


                await resume_hobbies.bulkCreate(resumeObj)
                    .then(async result => {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Hobby added successfully")
                        );
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

    update_hobbies: async(req, res) => {
        const requestParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
            resume_id: Joi.number().required(),
            hobbyName: Joi.string().required(),
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit hobbies resume validation', error))
            )
        } else {

            await resume_hobbies.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            resume_id: requestParam.resume_id,
                            hobbyName: requestParam.hobbyName,
                        }
                        resume_hobbies.update(Obj, {
                            where: {
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            console.log(updateData);
                            if (updateData) {
                                const Data = await resume_hobbies.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Hobbies details updated successfully')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Hobbies details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    delete_hobbies: async(req, res) => {

        const requestParam = req.params;
        const resumeData = await resume_hobbies.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume hobbies found'),
                FAIL
            )
        } else {
            resume_hobbies.destroy({
                    where: {
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Resume hobbies deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete resume hobbies'),
                            FAIL
                        )
                    }
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

    // reference details
    create_reference: async(req, res) => {

        const requestParam = req.body;

        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            designation: Joi.string().required(),
            phone: Joi.string().required(),
            email: Joi.string().required(),
        }

        const schema = Joi.object(reqObj);
        const {
            error
        } = schema.validate(requestParam)

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Reference validation", error))
            );
        } else {
            if (requestParam.title && requestParam.title !== "") {
                const resumeObj = {
                    resume_id: requestParam.resume_id,
                    title: requestParam.title,
                    designation: requestParam.designation,
                    phone: requestParam.phone,
                    email: requestParam.email,
                };

                await resume_reference.create(resumeObj)
                    .then(async result => {
                        return Response.successResponseData(
                            res,
                            result,
                            SUCCESS,
                            res.locals.__("Reference added successfully")
                        );
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

    update_reference: async(req, res) => {
        const requestParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
            resume_id: Joi.number().required(),
            title: Joi.string().required(),
            designation: Joi.string().required(),
            phone: Joi.string().required(),
            email: Joi.string().required(),
        };
        const schema = Joi.object(reqObj)
        const {
            error
        } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit reference resume validation', error))
            )
        } else {

            await resume_reference.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            resume_id: requestParam.resume_id,
                            title: requestParam.title,
                            designation: requestParam.designation,
                            phone: requestParam.phone,
                            email: requestParam.email,
                        }
                        resume_reference.update(Obj, {
                            where: {
                                id: requestIdParam.id,
                            },
                        }).then(async(updateData, err) => {
                            if (updateData) {
                                const Data = await resume_reference.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Reference details update success')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }).catch(async() => {
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Reference details not available')
                        )
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

    delete_reference: async(req, res) => {

        const requestParam = req.params;
        const resumeData = await resume_reference.findByPk(requestParam.id)


        if (resumeData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume reference found'),
                FAIL
            )
        } else {
            resume_reference.destroy({
                    where: {
                        id: requestParam.id
                    }
                })
                .then((data) => {

                    if (data) {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Resume reference deleted'),
                            SUCCESS
                        )
                    } else {
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete resume reference'),
                            FAIL
                        )
                    }
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

    resume_html: async(req, res) => {

        const { authUserId } = req;

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
                    model: SkillSubCategory
                }]

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

            },
            {
                model: state,
                attributes: ["id", "name"],
                required: false,

            },
        ];

        let resumeOptions = {
            where: {
                user_id: authUserId
            },
            include: arr
        }

        let resumeData = await resume.findOne(resumeOptions)

        if (!resumeData) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume found'),
                FAIL
            )
        } else {
            res.render('resume/resume.ejs', {
                data: resumeData
            })
        }

    },


    resume_html_no_Auth: async(req, res) => {

        const resume_user_id = req.query.id;

        console.log(" ::  into the controller resume_user_id ::", resume_user_id);

        if (!resume_user_id) {
            return Response.errorResponseData(
                res,
                res.__("Id is required")
            );
        }

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
                    model: SkillSubCategory
                }]

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

            },
            {
                model: state,
                attributes: ["id", "name"],
                required: false,

            },
        ];

        let resumeOptions = {
            where: {
                user_id: resume_user_id
            },
            include: arr
        }

        let resumeData = await resume.findOne(resumeOptions)

        console.log(" :: resumeData :: ", resumeData);

        if (!resumeData) {
            Response.successResponseWithoutData(
                res,
                res.__('No resume found'),
                FAIL
            )
        } else {
            pdf.create(res.render('resume/resume.ejs', {
                data: resumeData
            })).toStream(function(err, stream) {
                if (err) return console.log(err);
                res.setHeader("Content-Type", "application/pdf");
                stream.pipe(res);
            });
        }
    }
}