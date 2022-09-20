const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const { SUCCESS, FAIL, INTERNAL_SERVER ,BAD_REQUEST } = require("../../services/Constants");

const { serviceProviderBranch, state, User, city,SubscribedUser, sequelize } = require("../../models");

module.exports = {

	AddServiceProviderBranch: async (req, res) => {
        
		const requestParam = req.body;
		const { authUserId } = req;

        await SubscribedUser.findOne({
			where : {
				user_id : authUserId
			}
		})
        .then(async data =>{
            if(data){
                const reqObj = {
                    shop_name: Joi.string().required(),
                    address1: Joi.string().required(),
                    pin_code: Joi.string().regex(/^[0-9]*$/).required(),
                    state_id: Joi.number().required(),
                    city_id: Joi.number().required(),
                    address2: Joi.string().optional(),
                };
        
                const schema = Joi.object(reqObj);
                const { error } = schema.validate(requestParam);
        
                if (error) {
                    return Response.validationErrorResponseData(
                        res,
                        res.__(Helper.validationMessageKey("Branch validation", error))
                    );
                } else {
                    if (requestParam.shop_name && requestParam.shop_name !== "") {
                        const branchObj = {
                            service_provider_id: authUserId,
                            shop_name: requestParam.shop_name,
                            address1: requestParam.address1,
                            address2: requestParam.address2,
                            pin_code: requestParam.pin_code,
                            state_id: requestParam.state_id,
                            city_id: requestParam.city_id,
                        };
                        await serviceProviderBranch
                            .create(branchObj)
                            .then(async result => {
                                return Response.successResponseData(
                                    res,
                                    result,
                                    SUCCESS,
                                    res.locals.__("Branch added successfully")
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
            }else{
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
     * @description  Provides list of Branches of LoggedIn(service_provider) user
     * @param req
     * @param res
     * */
	ServiceProviderBranchList: async (req, res) => {

        const { page, sortBy, branchId} = req.query;

        if(branchId && branchId != ''){

            await serviceProviderBranch.findByPk(branchId)
                .then(async data =>{
                    if(data){
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("success")
                        );
                    }else{
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("No Service Branch Found"),
                            FAIL
                        );
                    }
                })
                .catch(() =>{
                    Response.errorResponseData(
                        res,
                        res.__("Internal Error"),
                        INTERNAL_SERVER
                    );
                }) 

        }else{

            let limit = 0;
            if (page) limit = 26;
            const pageNo = page && page > 0 ? parseInt(page,10) : 26 ;

            const offset = (pageNo - 1) * limit;
            let sorting = [
                ['id', sortBy != null ? sortBy : 'ASC']
            ]

            const { authUserId } = req;
            let arr = [
                {
                    model: User,
                    attributes: ["id", "name"],
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

            const options = {
                include: arr,
                where: {
                    'service_provider_id': authUserId,
                },
                offset: offset,
                order: sorting
            };
            if (limit) options['limit'] = limit;
            
            await serviceProviderBranch
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
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                );

            }
	},


    /**
     * @description delete single Branch
     * @param req
     * @param res
     * */
     DeleteServiceProviderBranch: async (req, res) => {

        const {authUserId} = req;
        const requestParam = req.params;
        const branchData = await serviceProviderBranch.findByPk(requestParam.id)


        if (branchData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No branch found'),
                FAIL
            )
        } else {
            serviceProviderBranch.destroy({
                where:{
                    service_provider_id : authUserId,
                    id : requestParam.id
                }
            })
                .then(( data ) => {

                    if(data){
                        Response.successResponseWithoutData(
                            res,
                            res.__('Branch deleted'),
                            SUCCESS
                        )
                    }else{
                        Response.successResponseWithoutData(
                            res,
                            res.__('Cannot delete branch'),
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

    /**
     * @description 'This function is use to edit serviceProviderBranch details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

     UpdateServiceProviderBranch: async(req, res) => {
        const reqParam = req.body;
        const { authUserId } = req
        // const requestIdParam = req.params;
        const reqObj = {
			shop_name: Joi.string().required(),
			address1: Joi.string().required(),
			address2: Joi.string().optional(),
			pin_code: Joi.string()
				.regex(/^[0-9]*$/)
				.required(),
			state_id: Joi.number().required(),
			city_id: Joi.number().required(),
            branch_id : Joi.number().required(),
		};
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit branch validation', error))
            )
        } else {

            await serviceProviderBranch.findOne({
                    where: {
                        service_provider_id : authUserId,
                        id: reqParam.branch_id,
                    },
                })
                .then(async(customData) => {

                    if (customData) {
                        const Obj = {
                            shop_name: reqParam.shop_name,
                            address1: reqParam.address1,
                            address2: reqParam.address2,
                            pin_code: reqParam.pin_code,
                            state_id: reqParam.state_id,
                            city_id: reqParam.city_id,
                            branch_id : reqParam.branch_id,
                        }
                        serviceProviderBranch.update(Obj, {
                            where: {
                                service_provider_id : authUserId,
                                id:reqParam.branch_id
                            },
                        }).then(async(updateData, err) => {
                            console.log(updateData);
                            if (updateData) {
                                const Data = await serviceProviderBranch.findByPk(reqParam.branch_id)
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
                        }).catch(async(e) => {
                            console.log("::",e);
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        })
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__('Service branch details not available')
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

};
