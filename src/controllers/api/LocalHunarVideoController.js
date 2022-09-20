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
	ACCEPT,
	PENDING,
} = require("../../services/Constants");
const Joi = require("@hapi/joi");
const moment = require("moment");
const path = require("path");

const { LocalHunarVideos } = require("../../models");

module.exports = {

	AddVideo: async (req, res) => {
		const { authUserId } = req;
		const fields = req.files;
		const requestParam = req.fields;
		let videos;

		const reqObj = {
			title: Joi.string().trim().required(),
			description: Joi.string().optional().allow(""),
			length : Joi.string().required()
		};

		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParam);

		if (error) {
			return Response.validationErrorResponseData(
				res,
				res.__(Helper.validationMessageKey("Video validation", error))
			);
		} else {
			videos = true;
			const extension = fields.video.type;
			const videoExtension = [
				"video/mp4",
				"video/webm",
				"video/x-m4v",
				"video/quicktime",
				"application/octet-stream"
			];

			console.log(" extension :::: ,fields.video.type ::: ", fields.video.type);
			if (fields && fields.video && !videoExtension.includes(extension)) {
				return Response.errorResponseData(
					res,
					res.__("Video invalid"),
					BAD_REQUEST
				);
			}
			let videoName = videos
				? `${
						fields.video.name.split(".")[0]
				  }${moment().unix()}${path.extname(fields.video.name)}`
				: "";
			Helper.VideoUpload(req, res, videoName);

			if (fields.video && fields.video != "") {
				const videObj = {
					user_id: authUserId,
					title: requestParam.title,
					description: requestParam.description,
					url: videoName,
					length : requestParam.length,
					views: 0,
					approved: PENDING,
				};
				await LocalHunarVideos.create(videObj)
					.then(async result => {
						return Response.successResponseData(
							res,
							result,
							SUCCESS,
							res.locals.__("Video added Successfully")
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
	},

    VideoList : async (req,res) => {
        const {
            video_id,
            approved,
            page,
            sortBy,
			view
        } = req.query;

        const {authUserId} = req;
        
        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page,10) : 26 ;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

		view ? sorting = [['views', 'DESC']] : '';

        let query = {
            user_id : authUserId,
        }

        let options = {
            where:query,
            order : sorting,
            offset:offset,
        }

	

		if(approved) query['approved'] = approved;
        if(limit) options['limit'] = limit;

        if(video_id && video_id != ''){
			query['id'] = video_id;
			await LocalHunarVideos.findOne(options)
                .then(async data =>{
                    if(data){
						data.url = `/assets/videos/${data.url}`;
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    }else{
                        console.log(e);
                    	Response.errorResponseData(
                        res,
                        res.__("Internal error"),
                        INTERNAL_SERVER
                    );
                    }
                }) 
                .catch((e) =>{
					console.log("error ::", e);
					return Response.errorResponseWithoutData(
						res,
						res.locals.__("No video found"),
						FAIL
					);
					
                }) 

		}else{				
			await LocalHunarVideos
				.findAndCountAll(options)
				.then(
					async data => {
						if (data.rows.length > 0) {
							for(var SingleVideo of data.rows){
								SingleVideo.url = `/assets/videos/${SingleVideo.url}`
							}
							return Response.successResponseData(
								res,
								data,
								SUCCESS,
								res.locals.__("Success")
							);
						} else {
							return Response.errorResponseWithoutData(
								res,
								res.locals.__("No video found"),
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

    DeleteLocalHunarVideo : async(req,res) =>{
        const{authUserId} = req;
        const reqParam = req.params;

        // to find if video Exist for the loggedIn person
        let videoData = await LocalHunarVideos.findOne({
            where : {
                user_id : authUserId,
                id : reqParam.id
            }
        })
        if(videoData){
            Helper.RemoveVideo(res, videoData.url); 
            await LocalHunarVideos.destroy({
                where :{
                    id : videoData.id
                }
            })

            return Response.successResponseData(
                res,
                'deleted',
                SUCCESS,
                res.locals.__("Video deleted Successfully")
            );
        }else{
            return Response.errorResponseData(
                res,
                res.__("No video found")
            );
        }
        

    },

    IncrementViews : async(req,res) =>{
		const reqParam = req.params.id;
		let videoDetails = await LocalHunarVideos.findByPk(reqParam);

		if(!videoDetails){
			Response.successResponseWithoutData(
				res,
				res.__("No video found"),	
				FAIL
			);
		}else{
			videoDetails.views += 1; 
			await videoDetails.save();
			let result = await LocalHunarVideos.findByPk(reqParam);
			return Response.successResponseData(
				res,
				result,
				SUCCESS,
				res.locals.__("Video views added Successfully")
			);
		}
    },

	EditVideo: async(req,res) =>{
		const { authUserId } = req;
		const fields = req.files;
		const requestParam = req.fields;
		let videos;

		const reqObj = {
			title: Joi.string().trim().required(),
			description: Joi.string().optional().allow(""),
			video_id : Joi.number().required(),
			length : Joi.string().optional()
		};

		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParam);

		if (error) {
			return Response.validationErrorResponseData(
				res,
				res.__(Helper.validationMessageKey("Video validation", error))
			);
		} else {

			let videoDetails = await LocalHunarVideos.findOne({
				where :{
					id : requestParam.video_id,
					user_id : authUserId
				} 
			})

			if(!videoDetails){
				Response.successResponseWithoutData(
					res,
					res.__("No Video found"),	
					FAIL
				);
			}else{
				let videoName;

				if(fields.video && fields.video != ""){

					Helper.RemoveVideo(res, videoDetails.url); 
					
					videos = true;
					const extension = fields.video.type;
					const videoExtension = [
						"video/mp4",
						"video/webm",
						"video/x-m4v",
						"video/quicktime",
					];
					if (fields && fields.video && !videoExtension.includes(extension)) {
						return Response.errorResponseData(
							res,
							res.__("Video invalid"),
							BAD_REQUEST
						);
					}
					videoName =  videos? `${fields.video.name.split(".")[0]}${moment().unix()}${path.extname(fields.video.name)}`: "";
					Helper.VideoUpload(req, res, videoName);
				}

					let videObj = {
						title: requestParam.title,
						description: requestParam.description,
					};

					if(videoName){
						videObj.url = videoName,
						requestParam.length ? videObj.length = requestParam.length : Response.errorResponseData(res,res.__("Length is Required"),BAD_REQUEST);
					}

					await LocalHunarVideos.update(videObj,{
						where : {
							id : requestParam.video_id
						},	
					})
						.then(async result => {
							return Response.successResponseData(
								res,
								result,
								SUCCESS,
								res.locals.__("Video updated Successfully")
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
	},

	dashboardDetails : async(req,res) =>{
		const {authUserId} = req;
			const d = new Date();
			let name = d.getMonth() + 1;
			let videoUploadedThisMonthCount = await LocalHunarVideos.count({
				where : {
					user_id : authUserId,
					[Op.and] : [Sequelize.where(Sequelize.fn('Month', Sequelize.col('createdAt')),name)]
				},
			});
			
			let totalViewsThisMonth = await LocalHunarVideos.sum('views',{
				where : {
					user_id : authUserId,
					[Op.and] : [Sequelize.where(Sequelize.fn('Month', Sequelize.col('createdAt')),name)]
				},
			});
			let totalVideosUploaded =  await LocalHunarVideos.count({
				where : {
					user_id : authUserId,
				},
			});;
			let totalViewsOfAllTime = await LocalHunarVideos.sum('views',{
				where : {
					user_id : authUserId,
				},
			});

		 	let dashboardDetails = {
				videoUploadedThisMonthCount,
				totalViewsThisMonth,
				totalVideosUploaded,
				totalViewsOfAllTime
			} 

			return Response.successResponseData(
				res,
				dashboardDetails,
				SUCCESS,
				res.locals.__("Success")
			);

	},

	getAllVideo :async(req,res)=> {

		const { 
            page,
            sortBy
        } = req.query;


		let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page,10) : 26 ;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        let options = {
            where:{
				approved : YES
			},
            order : sorting,
            offset: offset,
        }

		if(limit) options['limit'] = limit;

		await LocalHunarVideos
				.findAndCountAll(options)
				.then(
					async data => {
						if (data.rows.length > 0) {
							for(var SingleVideo of data.rows){
								SingleVideo.url = `/assets/videos/${SingleVideo.url}`;

							}
							return Response.successResponseData(
								res,
								data,
								SUCCESS,
								res.locals.__("Success")
							);
						} else {
							return Response.errorResponseWithoutData(
								res,
								res.locals.__("No video found"),
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
};
