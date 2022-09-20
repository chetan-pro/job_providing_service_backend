const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const Mailer = require('../../services/Mailer')
const { Sequelize } = require("sequelize");

const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    BAD_REQUEST,
    ACCEPT,
    REJECT,
    CANCEL,
    REQUEST,
    PENDING,
    COMPLETED,
    ACTIVE,
    GlOBAL_IMAGE_PATH
} = require("../../services/Constants");

const {
    serviceRequest,
    service,
    User,
    rateServiceRequest,
    Notification,
    ServiceCategory,
    city,
    state,
    serviceProviderBranch
} = require("../../models");

module.exports = {
    
    AddServiceRequest: async(req, res) => {
        const requestParam = req.body;
        const { authUserId } = req;
        const reqObj = {
            request_date: Joi.date().required(),
            branch_id: Joi.number().required(),
            // service_provider_status: Joi.string()
            // 	.required()
            // 	.valid(ACCEPT, REJECT, CANCEL, COMPLETED, PENDING),
            user_status: Joi.string().required(REQUEST, REJECT),
            service_id: Joi.string().required()
        };

        const schema = Joi.object(reqObj);
        const { error } = schema.validate(requestParam);

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey("Service request validation",error)
                )
            );
        } else {
            const serviceProviderBranchData = await serviceProviderBranch.findByPk(requestParam.branch_id);
            const serviceData = await service.findByPk(requestParam.service_id);

            if (serviceProviderBranchData && serviceData && serviceProviderBranchData.service_provider_id === serviceData.service_provider_id) {
                if (requestParam.request_date && requestParam.request_date !== "") {
                    const requestObj = {
                        user_id: authUserId,
                        service_id: requestParam.service_id,
                        request_date: requestParam.request_date,
                        user_status: requestParam.user_status,
                        branch_id: requestParam.branch_id
                    };

                    await serviceRequest
                        .create(requestObj)
                        .then(async result => {
                            
                            if (result && result != '') {
                                let ServiceProviderDetails = await User.findByPk(
                                    serviceData.service_provider_id
                                );
                                let notification = {
                                    title: "Service Request Recieved",
                                    message: "Req for service",
                                    notification_type: "service",
                                    status: ACTIVE,
                                    user_id: ServiceProviderDetails.id
                                };
                                if (
                                    ServiceProviderDetails.fcm_token !== null ||
                                    ServiceProviderDetails.fcm_token !== ""
                                ) {
                                    Notification.create(notification)
                                        .then(async result => {
                                            if (result) {
                                                Helper.pushNotification(
                                                    notification,
                                                    ServiceProviderDetails.fcm_token
                                                );
                                            }
                                        })
                                        .catch(e => {
                                            console.log(e);
                                            return Response.errorResponseData(
                                                res,
                                                res.__("Internal error"),
                                                INTERNAL_SERVER
                                            );
                                        });
                                }

                                let SeekerDetails = await User.findByPk(authUserId);

                                const locals = {
                                	providerName: ServiceProviderDetails.name,
                                	username: SeekerDetails.name,
                                    serviceName : serviceData.name,
                                	appName: Helper.AppName,
                                    requestDate : requestParam.request_date
                                };

                                const mail = Mailer.sendMail(ServiceProviderDetails.email, 'Service requested Received', Helper.addServiceRequest,locals);
                              
                                return Response.successResponseData(
                                    res,
                                    result,
                                    SUCCESS,
                                    res.locals.__(
                                        "Service request added successfully"
                                    )
                                );
                            } 
                            // else {
                            //     return Response.errorResponseWithoutData(
                            //         res, { data: result[0], Message: "Request alreay exists" },
                            //         FAIL
                            //     );
                            // }

                        })
                        .catch(e => {
                            console.log(e);
                            return Response.errorResponseData(
                                res,
                                res.__("Something went wrong")
                            );
                        });
                }
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No data found for given service id / branch id"),
                    FAIL
                );
            }
        }
    },

    /**
     * @description  Provides list of Requests of LoggedIn user
     * @param req
     * @param res
     * */
    ServiceRequestList: async(req, res) => {
        const { user_status, status, page, sortBy, service_request_id, branch_id, month, year } = req.query;
        const { authUserId } = req;
        let arr = [{
                model: User,
                // attributes: ["id", "name","email", "mobile", ""],
                include: [{
                    model: city,
                    attributes: ["id", "name"],
                }, {
                    model: state,
                    attributes: ["id", "name"],
                }]
            },
            {
                model: service,
                attributes: ["id", "service_name","service_charge"],
                where: {
                    service_provider_id: authUserId
                },
                include: {
                    model: ServiceCategory,
                }
            },
            {
                model: serviceProviderBranch,
                where: {
                    service_provider_id: authUserId
                },
                attributes: ["id", "service_provider_id", "shop_name", "address1"]
            }
        ];

        console.log("User::: , ", authUserId);
        if (service_request_id && service_request_id != "") {

            console.log(":::::::service_request_id :: ", service_request_id);

            await serviceRequest
                .findAndCountAll({
                    where: {
                        id: service_request_id,
                    },
                    include: arr
                })
                .then(async data => {
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
                            res.locals.__("No service request found"),
                            FAIL
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
            let limit = 0;
            if (page) limit = 26;
            const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

            const offset = (pageNo - 1) * limit;
            let sorting = [
                ["id", sortBy != null ? sortBy : "ASC"]
            ];

            const options = {
                include: arr,
                where: {},
                // attributes:[[ sequelize.fn('MONTH', sequelize.col('createdAt')), 'april']],
                offset: offset,
                order: sorting,
            };
            if (limit) options["limit"] = limit;
            if (status) options["where"]["service_provider_status"] = status;
            if (user_status) options["where"]["user_status"] = user_status;
            if (branch_id) options["where"]["branch_id"] = branch_id;

            if (year) options['where'] = {
                [Op.and]: [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('serviceRequest.createdAt')), year)]
            }
            if (year && month) {
                options['where'][Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('serviceRequest.createdAt')), month))
            }
            await serviceRequest.findAndCountAll(options).then(
                data => {
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
     * @description delete single ServiceRequest
     * @param req
     * @param res
     * */
    DeleteServiceRequest: async(req, res) => {
        const { authUserId } = req;
        const requestParam = req.params;
        const serviceRequestData = await serviceRequest.findAll({
            where: {
                user_id: authUserId,
                id: requestParam.id,
            },
        });
        if (serviceRequestData === null || serviceRequestData.length === 0) {
            Response.successResponseWithoutData(
                res,
                res.__("No data found"),
                FAIL
            );
        } else {
            serviceRequest
                .destroy({
                    where: {
                        user_id: authUserId,
                        id: requestParam.id,
                    },
                })
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__("Service request deleted"),
                        SUCCESS
                    );
                })
                .catch(() => {
                    Response.errorResponseData(
                        res,
                        res.__("Something went wrong"),
                        BAD_REQUEST
                    );
                });
        }
    },

    /**
     * @description 'This function is use to edit serviceRequests details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

    UpdateServiceRequestSeeker: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req;
        // const requestIdParam = req.params;

        const reqObj = {
            request_date: Joi.date().optional(),
            user_status: Joi.string().required(REQUEST, REJECT),
            service_request_id: Joi.number().required()
        };

        const schema = Joi.object(reqObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey(
                        "Edit service request validation",
                        error
                    )
                )
            );
        } else {
            await serviceRequest
                .findAll({
                    where: {
                        user_id: authUserId,
                        id: reqParam.service_request_id,
                    },
                })
                .then(async customData => {
                    if (customData.length > 0) {
                        if (
                            customData.service_provider_status != "ACCEPTED"
                        ) {
                            const requestObj = {
                                request_date: reqParam.request_date,
                                service_provider_status: customData.service_provider_status,
                                user_status: reqParam.user_status,
                            };

                            serviceRequest
                                .update(requestObj, {
                                    where: {
                                        user_id: authUserId,
                                        id: reqParam.service_request_id,
                                    },
                                })
                                .then(async(updateData, err) => {
                                    if (updateData.length > 0) {
                                        const Data =
                                            await serviceRequest.findByPk(
                                                reqParam.service_request_id
                                            );


                                        let usedData = await service.findByPk(Data.service_id);

                                        console.log(" customData :::  ,", usedData);


                                        let ServiceProviderDetails = await User.findByPk(usedData.service_provider_id);

                                        console.log(" customData :::  ,", ServiceProviderDetails);


                                        let notification = {
                                            title: "Service Request Updated",
                                            message: "Req for service",
                                            notification_type: "service",
                                            status: ACTIVE,
                                            user_id: ServiceProviderDetails.id
                                        };

                                        if (
                                            ServiceProviderDetails.fcm_token !== null ||
                                            ServiceProviderDetails.fcm_token !== ""
                                        ) {
                                            Notification.create(notification)
                                                .then(async result => {
                                                    if (result) {
                                                        Helper.pushNotification(
                                                            notification,
                                                            ServiceProviderDetails.fcm_token
                                                        );
                                                    }
                                                })
                                                .catch(e => {
                                                    console.log(e);
                                                    return Response.errorResponseData(
                                                        res,
                                                        res.__("Internal error"),
                                                        INTERNAL_SERVER
                                                    );
                                                });
                                        }

                                        // const locals = {
                                        // 	companyName: CompanyDetail.name,
                                        // 	username: userDetail.name,
                                        // 	appName: Helper.AppName,
                                        // 	jobTitle: CompanyDetail.job_title
                                        // };

                                        const mail = Mailer.sendMail(ServiceProviderDetails.email, 'Service request updated', "Service request update applied", notification);
                                        // if (mail) {
                                        // 	Response.successResponseData(
                                        // 		res,
                                        // 		result,
                                        // 		res.__('user Applied Successfully')
                                        // 	)
                                        // } else {
                                        // 	Response.errorResponseData(res, res.locals.__('global Error'), INTERNAL_SERVER);
                                        // }



                                        return Response.successResponseData(
                                            res,
                                            Data,
                                            SUCCESS,
                                            res.locals.__(
                                                "Service request update success"
                                            )
                                        );
                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Something went wrong")
                                        );
                                    }
                                })
                                .catch(async e => {
                                    console.log("****************", e);
                                    Response.errorResponseData(
                                        res,
                                        res.__("Internal error"),
                                        INTERNAL_SERVER
                                    );
                                });
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__(
                                    "Service request cannot be changed once accepted or rejected"
                                )
                            );
                        }
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__(
                                "Branch details not available"
                            )
                        );
                    }
                })
                .catch(async e => {
                    console.log("****************", e);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                });
        }
    },

    UpdateServiceRequestProvider: async(req, res) => {
        const reqParam = req.body;
        // const requestIdParam = req.params;

        const { authUserId } = req;

        const reqObj = {
            service_provider_status: Joi.string()
                .required()
                .valid(ACCEPT, REJECT, CANCEL, COMPLETED, PENDING),
            service_request_id: Joi.number().required()
        };

        const schema = Joi.object(reqObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(
                    Helper.validationMessageKey(
                        "Edit service request validation",
                        error
                    )
                )
            );
        } else {

            let requestData = await serviceRequest.findByPk(reqParam.service_request_id);

            if (!requestData) {
                return Response.errorResponseData(
                    res,
                    res.__("Service request does not exist")
                );
            }

            let serviceData = await service.findOne({
                where: {
                    id: requestData.service_id,
                    service_provider_id: authUserId,
                }
            });

            if (!serviceData) {
                return Response.errorResponseData(
                    res,
                    res.__("Service does not exist")
                );
            }

            await serviceRequest
                .findAll({
                    where: {
                        service_id: serviceData.id,
                        id: reqParam.service_request_id,
                    },
                })
                .then(async customData => {
                    if (customData.length > 0) {
                        if (
                            customData.user_status != "REJECTED"
                        ) {
                            const requestObj = {
                                request_date: customData.request_date,
                                service_provider_status: reqParam.service_provider_status,
                                user_status: customData.user_status,
                            };

                            serviceRequest
                                .update(requestObj, {
                                    where: {
                                        id: reqParam.service_request_id,
                                    },
                                })
                                .then(async(updateData, err) => {
                                    if (updateData) {

                                        updateData = await serviceRequest.findByPk(reqParam.service_request_id);
                                        const Data =
                                            await serviceRequest.findByPk(
                                                reqParam.service_request_id
                                            );

                                        let ServiceSeekerDetails = await User.findByPk(updateData.user_id);

                                        let notification = {
                                            title: "Service Request Updated",
                                            message: "Req for service",
                                            notification_type: "service",
                                            status: ACTIVE,
                                            user_id: ServiceSeekerDetails.id
                                        };


                                        console.log(":::: ,fcm ", ServiceSeekerDetails, ":::: id :: , ", reqParam.service_request_id);
                                        if (
                                            ServiceSeekerDetails.fcm_token != null ||
                                            ServiceSeekerDetails.fcm_token != ""
                                        ) {
                                            Notification.create(notification)
                                                .then(async result => {
                                                    if (result) {
                                                        Helper.pushNotification(
                                                            notification,
                                                            ServiceSeekerDetails.fcm_token
                                                        );
                                                    }
                                                })
                                                .catch(e => {
                                                    console.log(e);
                                                    return Response.errorResponseData(
                                                        res,
                                                        res.__("Internal error"),
                                                        INTERNAL_SERVER
                                                    );
                                                });
                                        }

                                        // const locals = {
                                        // 	companyName: CompanyDetail.name,
                                        // 	username: userDetail.name,
                                        // 	appName: Helper.AppName,
                                        // 	jobTitle: CompanyDetail.job_title
                                        // };

                                        const mail = Mailer.sendMail(ServiceSeekerDetails.email, 'Service request updated', "Service request update applied", notification);
                                        // if (mail) {
                                        // 	Response.successResponseData(
                                        // 		res,
                                        // 		result,
                                        // 		res.__('user Applied Successfully')
                                        // 	)
                                        // } else {
                                        // 	Response.errorResponseData(res, res.locals.__('global Error'), INTERNAL_SERVER);
                                        // }

                                        return Response.successResponseData(
                                            res,
                                            Data,
                                            SUCCESS,
                                            res.locals.__(
                                                "Service request update success"
                                            )
                                        );
                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Something went wrong")
                                        );
                                    }
                                })
                                .catch(async e => {
                                    console.log(" :: e ::", e);
                                    Response.errorResponseData(
                                        res,
                                        res.__("Internal error"),
                                        INTERNAL_SERVER
                                    );
                                });
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__(
                                    "Service request cannot be changed once accepted or rejected"
                                )
                            );
                        }
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__(
                                "Service provider branch details not available"
                            )
                        );
                    }
                })
                .catch(async e => {
                    console.log(":::::: eoor ,", e);
                    Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                });
        }
    },

    GetRequestesSeeker: async(req, res) => {

        const { provider_status, user_status, page, sortBy, branch_id, month, year } = req.query;
        const { authUserId } = req;
        let arr = [{
                model: User,
                attributes: ["id", "name", "state_id", "city_id"],
                include: [{
                        model: state
                    },
                    {
                        model: city
                    }
                ]
            },
            {
                model: service,
                // attributes: ["id", "service_name"],
            },
        ];

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ["id", sortBy != null ? sortBy : "DESC"]
        ];

        let options = {
            include: arr,
            where: {
                user_id: authUserId,
            },
            order: sorting,
            offset: offset
        }
        if (limit) options["limit"] = limit;

        console.log(" service_status  ::: ", provider_status);

        if (provider_status) {
            options["where"]["service_provider_status"] = provider_status
        }

        if (user_status) {
            options["where"]["user_status"] = user_status
        }

        if (branch_id) {
            options["where"]["branch_id"] = branch_id
        }

        if (year) options['where'] = {
            [Op.and]: [Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('serviceRequest.createdAt')), year)]
        }
        if (year && month) {
            options['where'][Op.and].push(Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('serviceRequest.createdAt')), month))
        }

        await serviceRequest
            .findAndCountAll(options)
            .then(
                data => {
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
                        res.__("Internal Error"),
                        INTERNAL_SERVER
                    );
                }
            );
    },

    /**
     * @description 'This function is used to get reviews of any service'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    GetRateServiceDetailsForService: async(req, res) => {
        const { authUserId } = req;
        const {service_request_id} = req.query;
        const requestIdParam = req.params;

        AddPath = (ImageArray) => {
            ImageArray.forEach(async SingleImage => {
                SingleImage.User['image'] = `${GlOBAL_IMAGE_PATH}/${SingleImage.User.image}`;
            })
        }

        let serviceData = await service.findByPk(requestIdParam.id);

        const options = {
            service_id: requestIdParam.id,
        }

        if(service_request_id) options["service_request_id"] = service_request_id;

        if (serviceData && serviceData != "") {
            if (requestIdParam && requestIdParam != "") {
                await rateServiceRequest
                    .findAndCountAll({
                        where: options,
                        include: [{
                            model: User,
                            attributes: [
                                "id",
                                "name",
                                "createdAt",
                                "updatedAt",
                                "image"
                            ],
                        }],
                        order: [
                            ['id', 'DESC']
                        ]
                    })
                    .then(async ratingData => {
                        if (!ratingData) {
                            return Response.errorResponseWithoutData(
                                res,
                                res.locals.__("No data found"),
                                FAIL
                            );
                        }
                        let initialValue = 0;
                        let sumOfStar =
                            ratingData.rows.reduce((previousValue, currentValue) => previousValue + currentValue.star, initialValue);
                        ratingData["mean"] = sumOfStar / ratingData.count;


                        await AddPath(ratingData.rows);


                        if (ratingData.count > 0) {
                            return Response.successResponseData(
                                res,
                                ratingData,
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
                    })

                err => {
                    console.log(err);
                    Response.errorResponseData(
                        res,
                        err,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                }
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("No data found"),
                    FAIL
                );
            }
        } else {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No data found"),
                FAIL
            );
        }
    },
};