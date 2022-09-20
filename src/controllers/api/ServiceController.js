const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");


const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    BAD_REQUEST,
    YES,
    NO,
    GlOBAL_IMAGE_PATH,
    ACCEPT,
    ACTIVE
} = require("../../services/Constants");
const Joi = require("@hapi/joi");
const moment = require("moment");
const path = require("path");

const {
    ServiceCategory,
    service,
    ServiceImage,
    serviceDays,
    serviceCategoryJn,
    serviceDaysJn,
    User,
    SubscribedUser,
    city,
    state,
    rateServiceRequest,
    serviceProviderBranch,
    serviceRequest,
} = require("../../models");

module.exports = {

    AddService: async(req, res) => {
        const { authUserId } = req;
        const fields = req.files;
        const requestParam = req.fields;
        let images;

        await SubscribedUser.findOne({
                where: {
                    user_id: authUserId
                }
            })
            .then(async data => {
                if (data) {
                    const reqObj = {
                        service_name: Joi.string().required(),
                        service_charge: Joi.number().required(),
                        service_status: Joi.string().required().valid(YES, NO),
                        service_categories: Joi.string().required(),
                        days_available: Joi.string().required(),
                    };

                    const schema = Joi.object(reqObj);
                    const { error } = schema.validate(requestParam);

                    if (error) {
                        return Response.validationErrorResponseData(
                            res,
                            res.__(Helper.validationMessageKey("Service validation", error))
                        );
                    } else {
                        if (requestParam.service_name && requestParam.service_name !== "") {
                            const ServiceObj = {
                                service_provider_id: authUserId,
                                service_name: requestParam.service_name,
                                service_charge: requestParam.service_charge,
                                service_status: requestParam.service_status
                            };
                            // 1. serviceProvider done

                            await service
                                .create(ServiceObj)
                                .then(async result => {
                                    // for multiple and single image
                                    try {
                                        let imageName;
                                        for (const Singleimage of fields.image) {
                                            images = true;
                                            const extension = Singleimage.type;
                                            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                                            if (fields && Singleimage && (!imageExtArr.includes(extension))) {
                                                return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                                            }
                                            imageName = images ? `${Singleimage.name.split(".")[0]}${moment().unix()}${path.extname(Singleimage.name)}` : '';
                                            await Helper.ImageUploadMultiple(Singleimage, res, imageName)
                                            await ServiceImage.create({
                                                service_id: result.id,
                                                image: imageName
                                            })
                                        }
                                    } catch (error) {
                                        let imageName;
                                        images = true;
                                        const extension = fields.image.type;
                                        const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                                        if (fields && fields.image && (!imageExtArr.includes(extension))) {
                                            return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                                        }
                                        imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                                        await Helper.ImageUpload(req, res, imageName)
                                        await ServiceImage.create({
                                            service_id: result.id,
                                            image: imageName
                                        })

                                    }
                                    // 2.image db and file done

                                    // for  multiple and single category
                                    try {
                                        let categoryArray = requestParam.service_categories.split(",");
                                        await categoryArray.forEach(async(data, index) => {
                                            await serviceCategoryJn.create({
                                                category_id: Number(data),
                                                service_id: result.id,
                                            });
                                        });
                                    } catch (error) {
                                        await serviceCategoryJn.create({
                                            category_id: Number(
                                                requestParam.service_categories
                                            ),
                                            service_id: result.id,
                                        });
                                    }
                                    // 3.service categoryjn create

                                    // for  multiple and single dayAvailable
                                    try {
                                        let daysArray = requestParam.days_available.split(",");
                                        await daysArray.forEach(async(data, index) => {
                                            await serviceDaysJn.create({
                                                day_id: Number(data),
                                                service_id: result.id,
                                            });
                                        });
                                    } catch (error) {
                                        await serviceDaysJn.create({
                                            day_id: Number(requestParam.days_available),
                                            service_id: result.id,
                                        });
                                    }
                                    // 4.service serviceDaysJn create 

                                    // .then
                                    return Response.successResponseData(
                                        res,
                                        result,
                                        SUCCESS,
                                        res.locals.__("Service added Successfully")
                                    );

                                })

                            .catch(e => {
                                console.log("error :;", e);
                                return Response.errorResponseData(
                                    res,
                                    res.__("Something went wrong")
                                );
                            });
                        }
                    }


                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("User not subscribed to any plan"),
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
            })
    },


    /**
     * @description  Provides list of services for LoggedIn(service_provider) user with filters
     * @param req
     * @param res
     * */
    ServiceList: async(req, res) => {

        AddPath = (ImageArray) => {
            ImageArray.forEach(async SingleImage => {
                SingleImage['image'] = `${GlOBAL_IMAGE_PATH}/${SingleImage.image}`;
            })
        }
        const { status, page, sortBy, serviceId } = req.query;
        const { authUserId } = req;

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

        if (serviceId && serviceId != '') {
            await service.findOne({
                    include: arr,
                    where: {
                        id: serviceId,
                        service_provider_id: authUserId,
                    },
                })
                .then(async data => {
                    await AddPath(data.ServiceImages);
                    if (data) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                })
                .catch((e) => {
                    console.log("error ::", e);
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No service found"),
                        FAIL
                    );

                })

        } else {

            let limit = 0;
            if (page) limit = 26;
            const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

            const offset = (pageNo - 1) * limit;
            let sorting = [
                ['id', sortBy != null ? sortBy : 'DESC']
            ]

            const options = {
                include: arr,
                where: {
                    service_provider_id: authUserId,
                },
                offset: offset,
                order: sorting
            };
            if (limit) options['limit'] = limit;
            if (status) options['where']["service_status"] = status;

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
        }

    },

    /**
     * @description delete single service
     * @param req
     * @param res
     * */
    DeleteService: async(req, res) => {

        const { authUserId } = req;

        let arr = [{
                model: User,
                attributes: ["id", "name"],
            },
            {
                model: serviceDays,
                attributes: ["id", "day_name"],
            },
            {
                model: ServiceCategory,
                attributes: ["id", "category_name"],
            },
            {
                model: ServiceImage,
                attributes: ["id", "image"],
            },
        ];

        const requestParam = req.params;
        const serviceData = await service.findAll({
            include: arr,
            where: {
                service_provider_id: authUserId,
                id: requestParam.id
            }
        })

        if (serviceData.length === 0) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            // 1. delete the service category from the junction Table
            await serviceData[0].ServiceCategories.forEach(async category => {
                await serviceCategoryJn.
                destroy({
                    where: {
                        service_id: category.service_category_jns.service_id,
                    }
                })
            })

            // 2.delete the service from days jn table
            await serviceData[0].serviceDays.forEach(async service => {
                await serviceDaysJn.
                destroy({
                    where: {
                        service_id: service.service_days_jns.service_id,
                    }
                })
            })

            // 3. delete the images form db 
            await serviceData[0].ServiceImages.forEach(async image => {
                await ServiceImage.
                destroy({
                    where: {
                        id: image.id,
                    }
                })
                await Helper.RemoveImage(res, image.image)
            })

            // 4. delete the service form db
            await service.destroy({
                    where: {
                        service_provider_id: authUserId,
                        id: requestParam.id
                    }
                })
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Service deleted'),
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


    /**
     * @description 'This function is use to edit service details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    UpdateService: async(req, res) => {

        const { authUserId } = req;
        const fields = req.files;
        const requestParam = req.fields;

        let images;
        let arr = [{
                model: User,
                attributes: ["id", "name"],
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

        const reqObj = {
            remove_images: Joi.string().optional(),
            service_name: Joi.string().required(),
            service_charge: Joi.number().required(),
            service_status: Joi.number().required().valid(YES, NO),
            service_categories: Joi.string().required(),
            days_available: Joi.string().required(),
            service_id: Joi.number().required()
        };
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(requestParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit service validation', error))
            )
        } else {
            const serviceData = await service.findOne({
                    where: {
                        id: requestParam.service_id,
                        service_provider_id: authUserId
                    }
                })
                .then(async(result) => {

                    try {
                        let categoryArray = requestParam.service_categories.split(",");
                        await serviceCategoryJn.destroy({
                            where: {
                                service_id: result.id
                            }
                        });
                        await categoryArray.forEach(async(data, index) => {
                            await serviceCategoryJn.create({
                                category_id: Number(data),
                                service_id: result.id,
                            });
                        });

                    } catch (error) {
                        await serviceCategoryJn.destroy({
                            where: {
                                service_id: result.id
                            }
                        });

                        await serviceCategoryJn.create({
                            category_id: Number(requestParam.service_categories),
                            service_id: result.id,
                        });
                    }
                    // 1. categoryUpdate Done


                    try {
                        let daysArray = requestParam.days_available.split(",");
                        await serviceDaysJn.destroy({
                            where: {
                                service_id: result.id
                            }
                        });
                        await daysArray.forEach(async(data, index) => {
                            await serviceDaysJn.create({
                                day_id: Number(data),
                                service_id: result.id,
                            });
                        });

                    } catch (error) {
                        await serviceDaysJn.destroy({
                            where: {
                                service_id: result.id
                            }
                        });
                        await serviceCategoryJn.create({
                            category_id: Number(requestParam.days_available),
                            service_id: result.id,
                        });
                    }
                    // 2.update days

                    if (requestParam.remove_images) {

                        let removeIds = await requestParam.remove_images.split(',');
                        console.log("inside remove images removeIds", removeIds);
                        await ServiceImage.findAll({
                                where: {
                                    id: {
                                        [Op.in]: removeIds
                                    }
                                }
                            })
                            .then(async serviceImgData => {
                                console.log("serviceImgData ::", serviceImgData);
                                for (const Singleimage of serviceImgData) {
                                    await Helper.RemoveImage(res, Singleimage.image)
                                }
                            })

                        await ServiceImage.destroy({
                            where: {
                                id: {
                                    [Op.in]: removeIds
                                }
                            }
                        }).then(data => console.log(" all removed ", data))
                    }

                    if (fields.image) {
                        try {
                            for (const Singleimage of fields.image) {
                                let imageName;
                                images = true;
                                const extension = Singleimage.type;
                                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                                if (fields && Singleimage && (!imageExtArr.includes(extension))) {
                                    return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                                }
                                imageName = images ? `${Singleimage.name.split(".")[0]}${moment().unix()}${path.extname(Singleimage.name)}` : '';
                                await Helper.ImageUploadMultiple(Singleimage, res, imageName)
                                await ServiceImage.create({
                                    service_id: result.id,
                                    image: imageName
                                })
                            }
                        } catch (error) {
                            let imageName;
                            images = true;
                            const extension = fields.image.type;
                            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                            if (fields && fields.image && (!imageExtArr.includes(extension))) {
                                return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                            }
                            imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                            await Helper.ImageUpload(req, res, imageName)
                            await ServiceImage.create({
                                service_id: result.id,
                                image: imageName
                            })

                        }
                    }


                    // 3.update images

                    const serviceUpdateObj = {
                        service_name: requestParam.service_name,
                        service_charge: requestParam.service_charge,
                        service_status: requestParam.service_status,
                    }

                    // 4.update service
                    // if(serviceUpdateObj)
                    if (serviceUpdateObj) {
                        service.update(serviceUpdateObj, {
                                where: {
                                    id: result.id
                                }
                            })
                            .then(async(UpdatedData) => {
                                if (UpdatedData) {
                                    const Data = await service.findOne({
                                        include: arr,
                                        where: {
                                            id: result.id
                                        }
                                    })
                                    return Response.successResponseData(
                                        res,
                                        Data,
                                        SUCCESS,
                                        res.locals.__('Service details update success')
                                    )
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__('Something went wrong')
                                    )
                                }

                            })

                    }

                })
                .catch(async(e) => {
                    console.log(e)
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Service details not available')
                    )
                })




        }
    },

    UpdateServiceStatus: async(req, res) => {
        const reqParam = req.body;
        const serviceId = req.params;
        const { authUserId } = req;

        await service.findOne({
                where: {
                    service_provider_id: authUserId,
                    id: serviceId.id
                }
            })
            .then(async UpdatedData => {
                if (UpdatedData) {

                    const stausUpdate = { service_status: reqParam.service_status };

                    service.update(stausUpdate, {
                            where: {
                                id: serviceId.id
                            }
                        })
                        .then(async updateData => {
                            if (updateData) {
                                const Data = await service.findByPk(serviceId.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Branch details updated successfully')
                                )
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        })

                } else {
                    return Response.successResponseWithoutData(
                        res,
                        res.locals.__('Service details not available')
                    )
                }
            })

    },

    /**
     * @description  Provides list of Branches to seeker as per filters
     * @param req
     * @param res
     * */

    ServiceListSeeker: async(req, res) => {

        AddPath = (ImageArray) => {
            ImageArray.forEach(async SingleImage => {
                SingleImage['image'] = `${GlOBAL_IMAGE_PATH}/${SingleImage.image}`;
            })
        }

        const { authUserId } = req;
        const { priceRange, states, cities, categoryIds, status, page, sortBy, serviceId, service_name, rating, service_request_id } = req.query;

        let arr = [{
                model: User,
                attributes: ["id", "name", "city_id", "state_id", "mobile"],
                include: [{
                        model: state
                    },
                    {
                        model: city
                    },
                    {
                        model: SubscribedUser,
                        where: {
                            status: ACTIVE,
                            expiry_date: {
                                [Op.gt]: moment()
                            }
                        }
                    }
                ],
                required: true
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
            // {
            // 	model : serviceRequest,
            // 	required : false,
            // 	// where :{
            // 	// 	user_id : authUserId
            // 	// }  
            // },
            {
                model: rateServiceRequest,
                required: false,
                // where :{
                // 	user_id : authUserId
                // },
            }
        ];

        let userIdArray = [];
        if (serviceId && serviceId != '') {

            await service.findOne({
                    include: arr,
                    where: {
                        id: serviceId,
                        service_status: {
                            [Op.ne]: 'N'
                        }
                    },
                })
                .then(async data => {

                    await AddPath(data.ServiceImages);

                    if (data.rateServiceRequests) {
                        let initialValue = 0;
                        let sumOfStar = data.rateServiceRequests.reduce((previousValue, currentValue) => previousValue + currentValue.star, initialValue);
                        data.dataValues["mean"] = sumOfStar / data.rateServiceRequests.length;
                    }

                    let serviceRequestDataSeeker;

                    if (service_request_id) {
                        serviceRequestDataSeeker = await serviceRequest.findOne({
                            where: {
                                user_id: authUserId,
                                service_id: serviceId,
                                id: service_request_id
                            }
                        })
                    }

                    console.log(" ::: service_request_id, ", service_request_id, " :: serviceRequestDataSeeker ::,", serviceRequestDataSeeker);

                    data.dataValues["serviceRequestDataSeeker"] = serviceRequestDataSeeker;


                    console.log(" :: dataValues ::: 813 :: authUserId", serviceRequestDataSeeker, authUserId);

                    if (data && data != '') {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                })
                .catch((e) => {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No service found"),
                        FAIL
                    );
                })

        } else {

            let limit = 0;
            if (page) limit = 26;
            const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

            const offset = (pageNo - 1) * limit;
            let sorting = [
                ['id', sortBy != null ? sortBy : 'DESC']
            ]

            const options = {
                include: arr,
                where: {
                    service_status: {
                        [Op.ne]: 'N'
                    }
                },
                offset: offset,
                order: sorting
            };
            if (limit) options['limit'] = limit;

            if (state || city) {
                const userOptions = {
                    where: {},
                    attributes: ['name', "id", "city_id", "state_id"]
                }
                if (states) userOptions['where']['$and'] = Sequelize.where(Sequelize.fn("", Sequelize.col("state_id")), states);
                if (cities) userOptions['where']['$and'] = Sequelize.where(Sequelize.fn("", Sequelize.col("city_id")), cities);

                await User.findAll(userOptions)
                    .then(async data => {

                        if (data && data != '') {
                            await data.forEach(singleData => {
                                userIdArray.push(singleData.id)
                            })
                        } else {
                            return Response.errorResponseWithoutData(
                                res,
                                res.locals.__("No data found"),
                                FAIL
                            );
                        }

                    })

                if (userIdArray.length > 0) options['where']['$and'] = Sequelize.where(Sequelize.fn("", Sequelize.col("service_provider_id")), {
                    [Op.or]: userIdArray
                });
            }

            if (priceRange) options['where']['service_charge'] = {
                [Op.between]: priceRange,
            }

            if (status) options['where']['service_status'] = {
                [Op.eq]: status,
            }

            if (categoryIds) {
                let categories = categoryIds.split(",");
                arr[2]["where"] = {
                    id: {
                        [Op.in]: categories
                    }
                }
            }

            if (service_name) options['where']['service_name'] = {
                [Op.or]: [{
                    [Op.like]: '%' + service_name + '%'
                }]
            }

            await service
                .findAndCountAll(options)
                .then(
                    async data => {
                        await data.rows.forEach(instance => {
                            AddPath(instance.ServiceImages)
                        })
                        await data.rows.forEach(async(serviceDets, index) => {
                            if (serviceDets.rateServiceRequests) {
                                let initialValue = 0;
                                let sumOfStar = await serviceDets.rateServiceRequests.reduce((previousValue, currentValue) => previousValue + currentValue.star, initialValue);
                                serviceDets.dataValues["mean"] = sumOfStar / serviceDets.rateServiceRequests.length;
                            }
                        })

                        let check;
                        console.log(":: rating :: ", rating);
                        rating ? check = rating.split(",") : rating;

                        if (check) {
                            await check.forEach((data, index) => {
                                check[index] = Number(check[index])
                            })
                        }
                        // if(rating)  data.rows = await data.rows.filter(e => e.dataValues.mean ? e.dataValues.mean == rating : '');
                        if (rating) data.rows = await data.rows.filter(e => e.dataValues.mean ? check.includes(e.dataValues.mean) : '');

                        console.log("data.rows ::: ", data.rows);

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
        }


    },

    /**
     * @description  Provides list of Branches of LoggedIn(service_provider) user
     * @param req
     * @param res
     * */
    ServiceProviderBranchAndServiceListSeeker: async(req, res) => {

        let { ServiceProviderName, page, sortBy, userId, cities, states, category_id, sortBy_service } = req.query;

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        sortBy_service === 'Ascending' ? sortBy_service = 'ASC' : sortBy_service = 'DESC';

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'ASC'],
            [service, 'id', sortBy_service != null ? sortBy_service : 'ASC']
        ]

        const options = {
            include: [{
                    model: city,
                    attributes: ["id", "name"],
                    where: {}
                },
                {
                    model: SubscribedUser,
                    where: {
                        status: ACTIVE,
                        expiry_date: {
                            [Op.gt]: moment()
                        }
                    }
                }, {
                    model: state,
                    attributes: ["id", "name"],
                    where: {}

                },

                {
                    model: service,
                    required: true,
                    include: [{
                            model: ServiceCategory,
                            attributes: ["id", "category_name"],
                            through: { attributes: [] }
                        },
                        {
                            model: serviceDays,
                            attributes: ["id", "day_name"],
                            through: { attributes: [] },
                        },
                        {
                            model: rateServiceRequest
                        },
                        {
                            model: ServiceImage
                        }
                    ],
                },
                {
                    model: serviceProviderBranch,
                },
            ],
            where: {
                user_role_type: "HSP",
            },
            offset: offset,
            order: sorting,
            attributes: ["id", "name", "email", "image", "mobile", "state_id", "city_id"]
        }

        if (cities) options["include"][0]["where"]["id"] = cities;
        if (states) {
            options["include"][1]["where"]["id"] = states;
            if (states && cities) {
                options["include"][0]["where"] = {
                    id: {
                        [Op.or]: cities
                    }
                }
                options["include"][1]["where"] = {
                    id: {
                        [Op.or]: states
                    }
                }
            }
        }

        if (category_id) {
            let categories = category_id.split(",");
            options["include"][2]["include"][0]["where"] = {
                id: {
                    [Op.in]: categories
                }
            }
        }

        if (userId && userId != '') {
            options["where"] = {
                id: userId
            }
            await User.findOne(options)
                .then(async data => {
                    if (data && data != '') {
                        if (data && data != '') {
                            return Response.successResponseData(
                                res,
                                data,
                                SUCCESS,
                                res.locals.__("Success")
                            );
                        } else {
                            return Response.errorResponseWithoutData(
                                res,
                                res.locals.__("No services found "),
                                FAIL
                            );
                        }
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No service provider found"),
                            FAIL
                        );
                    }
                })
        } else {
            const optsPagination = {}
            if (limit) optsPagination['limit'] = limit;

            if (ServiceProviderName) options['where']['name'] = {
                [Op.or]: [{
                    [Op.like]: '%' + ServiceProviderName + '%'
                }]
            }

            await User.findAndCountAll(options)
                .then(async data => {
                    if (data && data != '') {
                        // 	let userIdArray =[];
                        // 	let cityIdArray = [];
                        // 	await data.forEach(singleData =>{
                        // 		userIdArray.push(singleData.id)
                        // 		cityIdArray.push(singleData.city.id)
                        // 	})
                        // 	service.findAll({
                        // 		include :[
                        // 		{
                        // 			model : User,
                        // 			attributes : ["id","name","mobile","city_id","state_id"]
                        // 		},
                        // 		{
                        // 			model : ServiceCategory,
                        // 			attributes :["id","category_name"],
                        // 			through : {attributes: []}
                        // 		},
                        // 		{
                        // 			model : serviceDays,
                        // 			attributes :["id","day_name"],
                        // 			through : {attributes: []},
                        // 		},
                        // 		{
                        // 			model : rateServiceRequest,
                        // 		},
                        // 	],
                        // 	where:{
                        // 		service_provider_id : {
                        // 			[Op.in] : userIdArray
                        // 		}
                        // 	},
                        // 	offset: offset,
                        // 	order: sorting,
                        // 	optsPagination
                        // })
                        // 	.then( async userServiceData =>{
                        // 		let ShowBranchData ;
                        // 		await serviceProviderBranch.findAll({
                        // 			where : {
                        // 				service_provider_id : {
                        // 					[Op.in] : userIdArray
                        // 				},
                        // 				city_id :{
                        // 					[Op.in] :  cityIdArray
                        // 				}
                        // 			}
                        // 		})
                        // 		.then(branchData =>{
                        // 			if(branchData){
                        // 				ShowBranchData = branchData;
                        // 			}else{
                        // 				ShowBranchData = "No  branch Found"
                        // 			}
                        // 		})

                        // 		if(userServiceData && userServiceData.length > 0){							
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                        // }else{
                        // 	return Response.errorResponseWithoutData(
                        // 		res,
                        // 		res.locals.__("No services found"),
                        // 		FAIL
                        // 	);
                        // }

                        // })           
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No service provider found"),
                            FAIL
                        );
                    }
                })
                .catch((e) => {
                    console.log(" ::: error :::", e);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                })

        }
    },

    SeviceProviderDashboard: async(req, res) => {

        const {
            year,
            month,
            day,
        } = req.query;


        const { authUserId } = req;
        console.log(" authUserId ::: ,", authUserId);

        let userCondition = {
            service_provider_id: authUserId,
        }


        let arr = [{
            model: service,
            where: userCondition,
            attributes: ['id', 'service_provider_id', 'createdAt']
        }]

        let query = {};

        let options = {
            include: arr,
            where: query,
            attributes: [
                "service_provider_status",
            ],
            group: ['service_provider_status'],
        }

        // year
        if (year) {
            query[Op.and] = [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('serviceRequest.createdAt')), year)]
            options.attributes.push([Sequelize.fn('MONTH', Sequelize.col('serviceRequest.createdAt')), 'MonthCount'])
        }

        // year && month filter
        if (year && month) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('serviceRequest.createdAt')), month))
            options.attributes.push([Sequelize.fn('DAY', Sequelize.col('serviceRequest.createdAt')), 'Day'])
        }

        // year && month && day filter
        if (year && month && day) {
            query[Op.and].push(Sequelize.where(Sequelize.fn('DAY', Sequelize.col('serviceRequest.createdAt')), day))
        }

        let serviceProviderBranchCount = await serviceProviderBranch.count({
            where: userCondition
        })

        let serviceProviderServiceCount = await service.count({
            where: userCondition
        })

        let requestData = await serviceRequest.count({
            include: arr,
            group: ['service_provider_status'],
        })

        let a = [];
        await serviceRequest.count(options)
            .then(async data => {
                await data.forEach(sortedData => {
                    if (sortedData.service_provider_status === 'ACCEPTED') {

                        try {
                            a[sortedData.MonthCount] = {
                                MonthCount: sortedData.MonthCount,
                                acceptedRequestCount: sortedData.count,
                                ...sortedData
                            }
                        } catch (error) {
                            a[sortedData.MonthCount].MonthCount = sortedData.MonthCount
                            a[sortedData.MonthCount].acceptedRequestCount = sortedData.count
                        }

                    } else if (sortedData.service_provider_status === 'REJECTED') {

                        try {
                            a[sortedData.MonthCount].MonthCount = sortedData.MonthCount
                            a[sortedData.MonthCount].rejectedRequestCount = sortedData.count
                        } catch (error) {
                            a[sortedData.MonthCount] = {
                                MonthCount: sortedData.MonthCount,
                                rejectedRequestCount: sortedData.count,
                                ...sortedData
                            }
                        }

                    } else if (sortedData.service_provider_status === 'COMPLETED') {

                        try {
                            a[sortedData.MonthCount].MonthCount = sortedData.MonthCount
                            a[sortedData.MonthCount].completedRequestCount = sortedData.count
                        } catch (error) {
                            a[sortedData.MonthCount] = {
                                MonthCount: sortedData.MonthCount,
                                completedRequestCount: sortedData.count,
                                ...sortedData
                            }
                        }

                    }
                })

                data = a.filter(e => e != null);

                let alldata = {
                    grapData: data,
                    serviceProviderServiceCount,
                    serviceProviderBranchCount,
                    requestData
                }

                if (!alldata) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No Data Found"),
                        FAIL
                    );
                } else {
                    return Response.successResponseData(
                        res,
                        alldata,
                        SUCCESS,
                        res.locals.__("Success")
                    );
                }
            })
            .catch((e) => {
                console.log(":::: :::erorr :: ", e);
                Response.errorResponseData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                );
            })
    },

    serviceProviderBranchSeeker: async(req, res) => {

        const {
            provider_id,
            page,
            sortBy
        } = req.query

        if (!provider_id && provider_id != '') {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No service provider id given"),
                FAIL
            );
        }

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'ASC']
        ]

        let options = {
            where: {
                service_provider_id: provider_id,
            },
            include: [{
                    model: city,
                },
                {
                    model: state,
                }
            ],
            offset: offset,
            order: sorting
        }
        if (limit) options['limit'] = limit;

        await serviceProviderBranch.findAndCountAll(options)
            .then(branchData => {
                if (branchData) {
                    return Response.successResponseData(
                        res,
                        branchData,
                        SUCCESS,
                        res.locals.__("Success")
                    );
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No Branch found"),
                        FAIL
                    );
                }
            })
    },

    getCategoryCountInfo: async(req, res) => {

        serviceCategoryJn.findAndCountAll({
            attributes: {
                include: [
                    [Sequelize.fn('COUNT', 'serviceCategoryJn.category_id'), 'CategoryCount']
                ],
                exclude: ["service_id", "createdAt", "updatedAt", "id"]
            },
            include: [{
                model: ServiceCategory,
                attributes: ["id", "image", "category_name"]
            }],
            group: ["category_id"],

        }).then(data => {

            data["count"] = 0;

            if (!data) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No Data Found"),
                    FAIL
                );
            } else {
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__("Success")
                );
            }
        }).catch(errr => {
            console.log(errr);
            Response.errorResponseData(
                res,
                res.__("Internal error"),
                INTERNAL_SERVER
            );
        })

    }
};