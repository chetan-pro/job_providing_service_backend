const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const { SUCCESS, FAIL, INTERNAL_SERVER ,BAD_REQUEST } = require("../../services/Constants");

const {  rateServiceRequest , User ,serviceRequest ,service} = require("../../models");


module.exports ={

    AddRateServiceRequest: async (req, res) => {

		const requestParam = req.body;
		const { authUserId } = req;
        
        
        const serviceRequestData = await serviceRequest.findOne({where :{id : requestParam.service_request_id, user_id : authUserId}});
        
        if(serviceRequestData && serviceRequestData != ''){

            const reqObj = {
                star: Joi.number().required(),
                comment: Joi.string().optional(),
                service_request_id : Joi.number().required()
            };
    
            const schema = Joi.object(reqObj);
            const { error } = schema.validate(requestParam);
            if (error) {
                return Response.validationErrorResponseData(
                    res,
                    res.__(Helper.validationMessageKey("Rate service request validation", error))
                );  
            } else {
                if (requestParam.star && requestParam.star !== "") {
                    const RateServiceObj = {
                        user_id: authUserId,
                        service_request_id: requestParam.service_request_id,
                        service_id : serviceRequestData.service_id,
                        star: requestParam.star,
                        comment: requestParam.comment,
                    };

                    await rateServiceRequest.findOne({
                        where:{
                            user_id : authUserId,
                            service_request_id : requestParam.service_request_id,
                            service_id : serviceRequestData.service_id,
                        }
                    })
                    .then( async ratingsFound =>{

                        if(ratingsFound){
                            return Response.errorResponseData(
                                res,
                                res.locals.__("Rating already exists")
                            );
                        }else{
                            await rateServiceRequest
                            .create(RateServiceObj)
                            .then(async result => {
                                return Response.successResponseData(
                                    res,
                                    result,
                                    SUCCESS,
                                    res.locals.__("Rating added successfully")
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

                    })
                    .catch((e)=>{
                        console.log(e);
                        return Response.errorResponseData(
                            res,
                            res.__("Something went wrong")
                        );
                    })
                }
            }
        }else{
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No data found"),
                FAIL
            );
        }
	},


	/**
     * @description  Provides list of Requests of LoggedIn user
     * @param req
     * @param res
     * */
	 GetRateServiceRequestList: async (req, res) => {

        const {service_id , service_request_id} = req.query;

		const { authUserId } = req;
		let arr = [
			{
				model: User,
				attributes: ["id", "name"],
			},
			{
				model: serviceRequest,
				attributes: ["id", "service_id","request_date"],
			},
		];

        const options = {
            service_id : service_id,
            user_id : authUserId
        }

        if(service_request_id) options["service_request_id"] = service_request_id;


        if(service_id){
            await rateServiceRequest.findAll({
                where : options
            })
            .then(
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

		await rateServiceRequest
			.findAndCountAll({
				include: arr,
				where: {
					user_id: authUserId,
				},
			})
			.then(
				data => {
					if (data.count > 0) {
						return Response.successResponseData(
							res,
							{allData:data.rows ,count : data.count},
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

	/**
     * @description delete single ServiceRequest
     * @param req
     * @param res
     * */
     DeleteRateServiceRequest: async (req, res) => {

		const { authUserId } = req;
        const requestParam = req.params;
        const RateServiceRequestData = await rateServiceRequest.findByPk(requestParam.id)
		
		
        if (RateServiceRequestData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            rateServiceRequest.destroy({
                where:{
                    id : requestParam.id,
					user_id : authUserId,
                }
            })
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Service request deleted'),
                        SUCCESS
                    )
                })
                .catch((e) => {
					console.log(e);
                    Response.errorResponseData(
						e,
                        res,
                        res.__('Something went wrong, you cannot delete others review'),
                        BAD_REQUEST
                    )
                })
        }
    },


	/**
     * @description 'This function is use to edit RateServiceRequests details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
	UpdateRateServiceRequest: async(req, res) => {

        const reqParam = req.body;
        const { authUserId } = req;
        // const requestIdParam = req.params;

        const reqObj = {
			star: Joi.number().required(),
			comment: Joi.string().optional(),
            service_request_id : Joi.number().required(),
		};
    
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit rate service request validation', error))
            )
        } else {

            await rateServiceRequest.findByPk(reqParam.service_request_id)
                .then( async(customData) => {
                        if(customData.star && customData.star != '' ){

                            const requestObj = {
                                star: reqParam.star,
                                comment: reqParam.comment,
                            };
    
                            rateServiceRequest.update(requestObj, {
                                where: {
									user_id : authUserId,
                                    id: reqParam.service_request_id
                                },
                            }).then(async(updateData, err) => {
                                if (updateData) {
                                    const Data = await rateServiceRequest.findByPk(reqParam.service_request_id)
                                    return Response.successResponseData(
                                        res,
                                        Data,
                                        SUCCESS,
                                        res.locals.__('Rate service request update success')
                                    )
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__('Something went wrong')
                                    )
                                }
                            }).catch(async(e) => {
                                Response.errorResponseData(
                                    res,
                                    res.__('Internal error'),
                                    INTERNAL_SERVER
                                )
                            })
                        }else{
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__('No data found')
                            )
                        }
                        
                })
                .catch(async(e) => {
                    Response.errorResponseData(
                        res,
                        res.__('Internal Error'),
                        INTERNAL_SERVER
                    )
                })
        }
    },

}