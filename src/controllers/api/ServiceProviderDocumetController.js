const { Op } = require("sequelize");
const Response = require("../../services/Response");
const Helper = require("../../services/Helper");
const Joi = require("@hapi/joi");
const moment = require("moment");
const path = require("path");

const {
	SUCCESS,
	FAIL,
	INTERNAL_SERVER,
	DELETE,
	PER_PAGE,
	ACTIVE,
	BAD_REQUEST,
	USER_PROOF_TYPE,
} = require("../../services/Constants");
const { ServiceProviderDocument, User } = require("../../models");

module.exports = {
    
	addServiceProof: async (req, res) => {
		const requestParams = req.fields;
		const reqFiles = req.files;
		const { authUserId } = req;

		let images;
		const reqObj = {
			document_name: Joi.valid(
				USER_PROOF_TYPE.adhar_card,
				USER_PROOF_TYPE.voter_id,
				USER_PROOF_TYPE.driving_liscence,
				USER_PROOF_TYPE.pan_card
			).required(),
			document_number:Joi.when('document_name', [{
                is: Joi.valid(USER_PROOF_TYPE.adhar_card,),
                then: Joi.string().min(12).max(12).required(),
            },
            {
                is: Joi.valid(USER_PROOF_TYPE.voter_id,),
                then: Joi.string().min(10).max(10).required(),
            },
            {
                is: Joi.valid(USER_PROOF_TYPE.driving_liscence,),
                then: Joi.string().min(15).max(15).required(),
            },
            {
                is: Joi.valid(USER_PROOF_TYPE.pan_card,),
                then: Joi.string().min(10).max(10).required(),
            }]
            ),
			service_experience : Joi.string().required(),
		};

   
		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParams);

		if (error) {
			return Response.validationErrorResponseData(
				res,
				res.__(
					Helper.validationMessageKey(
						"Service documents validation",
						error
					)
				)
			);
		} else {
			let UserDetails = await User.findByPk(authUserId);
			if (!UserDetails || UserDetails.user_role_type != "HSP") {
				return Response.errorResponseWithoutData(
					res,
					res.locals.__("User details not found"),
					FAIL
				);
			} else {
				let imageName;
				let image_back_name;
				let image2;
				if(reqFiles.image && reqFiles.image != ''){
					images = true;
					const extension = reqFiles.image.type;
					let extension2 ;
					if(reqFiles.image_back && reqFiles.image_back != ''){
						extension2 = reqFiles.image_back.type;
						image2 = true;
					}
					const imageExtArr = [
						"image/jpg",
						"application/octet-stream",
						"image/jpeg",
						"image/png",
					];
					if(reqFiles && reqFiles.image && !imageExtArr.includes(extension) ){
						return Response.errorResponseData(
							res,
							res.__("Image invalid"),
							BAD_REQUEST
						);
					}

					imageName = images ? `${reqFiles.image.name.split(".")[0]}${moment().unix()}${path.extname(reqFiles.image.name)}`: "";
					image_back_name = image2 ? `${reqFiles.image_back.name.split(".")[0]}${moment().unix()}${path.extname(reqFiles.image_back.name)}`: "";
				}

				const serviceProof = {
					user_id: authUserId,
					document_name: requestParams.document_name,
					document_number: requestParams.document_number,
					image: imageName,
					image_back : image_back_name,
					service_experience : requestParams.service_experience
				};

				let foundUser = await ServiceProviderDocument.findOne({
					where: { user_id: authUserId },
				})

				if (foundUser && foundUser != "") {
					if(serviceProof.image && serviceProof.image != '' ){
						Helper.RemoveImage(res, foundUser.image);
						Helper.ImageUpload(req, res,serviceProof.image);
						foundUser.image = serviceProof.image;
					}
					if(serviceProof.document_name){
						foundUser.document_name = serviceProof.document_name;
					}
					if(serviceProof.document_number){
						foundUser.document_number =  serviceProof.document_number;
					}

					if(serviceProof.service_experience){
						foundUser.service_experience =  serviceProof.service_experience;
					}

					if(serviceProof.image_back && serviceProof.image_back != '' ){
						Helper.RemoveImage(res, foundUser.image_back);
						Helper.ImageUploadMultiple(reqFiles.image_back, res, serviceProof.image_back);
						foundUser.image_back = serviceProof.image_back;
					}

					foundUser
						.save()
						.then(async result => {
							return Response.successResponseData(
								res,
								result,
								SUCCESS,
								res.locals.__(
									"Service documents updated successfully"
								)
							);
						})
						.catch(e => {
							console.log(e);
							return Response.errorResponseData(
								res,
								res.__("Something went wrong")
							);
						});
				} else {

					Helper.ImageUpload(req, res, imageName);
					Helper.ImageUploadMultiple(reqFiles.image_back, res, image_back_name);

					ServiceProviderDocument.create(serviceProof)
						.then(async result => {
							return Response.successResponseData(
								res,
								result,
								SUCCESS,
								res.locals.__(
									"Service documents added successfully"
								)
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
		}
	},

    getServiceProofDetails: async(req,res) => {
        const {authUserId} = req;
        let userDets = await User.findByPk(authUserId);

        if(!(userDets && userDets != '')){
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("User details not found"),
                FAIL
            );
        }else{

            ServiceProviderDocument.findOne({
                where:{
                    user_id : authUserId
                }
            })
            .then(async result => {

				if(result.image){
					result.image = "/assets/images/user/" + result.image;
				}

                return Response.successResponseData(
                    res,
                    result,
                    SUCCESS,
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
    },

	deleteServiceProof : async(req,res) =>{
		const { authUserId } = req;
		const requestParam = req.params;
		const serviceDocumentData = await ServiceProviderDocument.findOne({
			where: {
				user_id: authUserId,
				id: requestParam.id,
			},
		});
		if (!serviceDocumentData) {
			Response.successResponseWithoutData( 
				res,
				res.__("No service document found"),
				FAIL
			);
		} else {
			ServiceProviderDocument
				.destroy({
					where: {
						user_id: authUserId,
						id: requestParam.id,
					},
				})
				.then(() => {
					Response.successResponseWithoutData(
						res,
						res.__("Service documents deleted"),
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
	}
};
