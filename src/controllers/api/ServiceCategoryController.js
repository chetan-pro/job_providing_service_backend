const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const { SUCCESS, FAIL, INTERNAL_SERVER ,BAD_REQUEST } = require("../../services/Constants");


const { ServiceCategory } = require("../../models");


module.exports ={
    AddServiceCategory: async (req, res) => {
        
        const requestParam = req.body;
		const reqObj = {
            category_name: Joi.string().required(),
			category_desc: Joi.string().required(),
		};

		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParam);

		if (error) {
			return Response.validationErrorResponseData(
				res,
				res.__(Helper.validationMessageKey("Service category validation", error))
			);
		} else {
			if (requestParam.category_name && requestParam.category_name !== ""){
				const serviceCategoryObj = {
					category_name: requestParam.category_name,
					category_desc: requestParam.category_desc,
				};
				await ServiceCategory
					.create(serviceCategoryObj)
					.then(async result => {
						return Response.successResponseData(
							res,
							result,
							SUCCESS,
							res.locals.__("Service added successfully")
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

    
    /**
     * @description  Provides list of Categories of Service 
     * @param req
     * @param res
     * */
	ServiceCategoriesList: async (req, res) => {

		await ServiceCategory
			.findAndCountAll()
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
     * @description delete single category
     * @param req
     * @param res
     * */
     DeleteServiceCategory: async (req, res) => {
        const requestParam = req.params;
        const branchData = await ServiceCategory.findByPk(requestParam.id)

        if (branchData === null) {
            Response.successResponseWithoutData(
                res,
                res.__('No data found'),
                FAIL
            )
        } else {
            ServiceCategory.destroy({
                where:{
                    id : requestParam.id
                }
            })
                .then(() => {
                    Response.successResponseWithoutData(
                        res,
                        res.__('Service provider category deleted'),
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
     * @description 'This function is use to edit serviceProviderBranch details'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */

     UpdateServiceCategory: async(req, res) => {
        const reqParam = req.body;
        const requestIdParam = req.params;
        const reqObj = {
			category_name: Joi.string().required(),
			category_desc: Joi.string().required(),
		};
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Edit service provider category validation', error))
            )
        } else {

            await ServiceCategory.findOne({
                    where: {
                        id: requestIdParam.id,
                    },
                })
                .then(async(customData) => {
                    if (customData) {
                        const Obj = {
                            category_name: reqParam.category_name,
					        category_desc: reqParam.category_desc,
                        }
                        ServiceCategory.update(Obj, {
                            where: {
                                id: requestIdParam.id
                            },
                        }).then(async(updateData, err) => {

                            
                            if (updateData) {
                                const Data = await ServiceCategory.findByPk(requestIdParam.id)
                                return Response.successResponseData(
                                    res,
                                    Data,
                                    SUCCESS,
                                    res.locals.__('Service provider category details updated successfully')
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
                            res.locals.__('Service provider category details not available')
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

}