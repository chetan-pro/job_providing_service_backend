const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");

const {
	SUCCESS,
	FAIL,
	INTERNAL_SERVER,
	BAD_REQUEST,
	WEEKDAYS
} = require("../../services/Constants");

const { serviceDays } = require("../../models");

module.exports = {
     /**
     * @description adds single day
     * @param req
     * @param res
     * */
	AddDays: async (req, res) => {
		const requestParam = req.body;
		const { authUserId } = req;
		const reqObj = {
			day_name: Joi.string().min(2).max(2)
			.valid(WEEKDAYS.MONDAY,WEEKDAYS.TUESDAY,WEEKDAYS.WEDNESDAY,WEEKDAYS.THURSDAY,WEEKDAYS.FRIDAY,WEEKDAYS.SATURDAY,WEEKDAYS.SUNDAY).required(),
		};

		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParam);

		if (error) {
			return Response.validationErrorResponseData(
				res,
				res.__(Helper.validationMessageKey("Day validation", error))
			);
		} else {
			if (requestParam.day_name && requestParam.day_name !== "") {
				const dayObj = {
					day_name: requestParam.day_name,
				};
				await serviceDays
					.findOrCreate({
						where: { day_name: requestParam.day_name },
					})
					.then(async result => {

						if(result[1]){
							return Response.successResponseData(
								res,
								result[0],
								SUCCESS,
								res.locals.__("Day added successfully")
							);
						}else{
							return Response.errorResponseWithoutData(
								res,
								res.locals.__(' Day is already added'),
								FAIL
							)
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
		}
	},

     /**
     * @description gives list of days
     * @param req
     * @param res
     * */
    
    DayList: async (req, res) => {
		await serviceDays
			.findAndCountAll()
			.then(
				data => {
					if (data.count > 0){
						return Response.successResponseData(
							res,
							{count : data.count , rows : data.rows},
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

};
