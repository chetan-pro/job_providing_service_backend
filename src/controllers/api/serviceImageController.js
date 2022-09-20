const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const moment = require('moment')
const path = require('path')


const {
	SUCCESS,
	FAIL,
	INTERNAL_SERVER,
	BAD_REQUEST,
	WEEKDAYS
} = require("../../services/Constants");

const { ServiceImage } = require("../../models");

module.exports = {
     /**
     * @description adds single day
     * @param req
     * @param res
     * */
	AddImage: async (req, res) => {
		const requestParam = req.files;
		const fields = req.fields;
        let image;
		
        if (req.files.image && req.files.image.size > 0) {
            image = true;
            const extension = req.files.image.type;
            const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
            if (req.files && req.files.image && (!imageExtArr.includes(extension))) {
                return Response.errorResponseData(res, res.__('image Invalid'), BAD_REQUEST);
            }
        }
        const imageName = image ? `${moment().unix()}${path.extname(req.files.image.name)}` : '';
		if (!(req.files.image) && req.files.image.size == 0) {

			return Response.validationErrorResponseData(
				res,
				res.__(Helper.validationMessageKey("Image validation", error))
			);
		} else {
			if (requestParam.image && requestParam.image !== "") {
				const imgObj = {
                    service_id:fields.service_id,
					image: imageName,
				};
        
                await Helper.ImageUpload(req, res, imageName);
				await ServiceImage
					.create(imgObj)
					.then(async result => {

						if(result){
							return Response.successResponseData(
								res,
								result,
								SUCCESS,
								res.locals.__("Image added successfully")
							);
						}else{
							return Response.errorResponseWithoutData(
								res,
								res.locals.__('Image is already registered with us'),
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

};
