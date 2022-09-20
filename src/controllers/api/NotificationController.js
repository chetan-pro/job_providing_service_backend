const { Op, Model } = require('sequelize')
const Response = require('../../services/Response')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    ACTIVE
} = require('../../services/Constants')
const { Notification } = require('../../models')

module.exports = {

    NotificationList : async (req,res) => {
        const {
            notification_id,
            page,
            sortBy,
        } = req.query;

        const {authUserId} = req;
        
        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page,10) : 26 ;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        let arr = [
            {
                model : Notification
            }
        ]

        let options = {
            where:{
                status : ACTIVE,
                user_id : authUserId,
            },
            order : sorting,
            offset:offset,
        }

        if(limit) options['limit'] = limit;
        if(notification_id && notification_id != ''){

			options['where']['id'] = notification_id;
			await Notification.findOne(options)
                .then(async data =>{
                    if(data){

                        await Notification.update(
                            {read_status : true},
                            {where: {id : data.id ,user_id : authUserId}}
                        )

                        console.log("::: all Updated ::: ");

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
						res.locals.__("No notification found"),
						FAIL
					);
                }) 

		}else{				
			await Notification
				.findAndCountAll(options)
				.then(
					async data => {
                        console.log("::: all Updated ::: ");
                        await Notification.update(
                            {read_status : true},
                            {where: {user_id : authUserId}}
                        )

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
								res.locals.__("No notification found"),
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

    UnreadNotificationCount :async(req,res) =>{
        const {authUserId} = req;
        let options = {
            where:{
                status : ACTIVE,
                user_id : authUserId,
                read_status : false
            },
        }
        await Notification
				.count(options)
				.then(
					async data => {
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
								res.locals.__("No unread notification found"),
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
    
    deleteNotification : async(req,res) =>{
        const { authUserId } = req;
		const requestParam = req.query;
        let notificationData;
        if(requestParam.id){
            notificationData = await Notification.findOne({
                where: {
                    user_id: authUserId,
                    id: requestParam.id,
                },
            })
        }else{
            await Notification.destroy({
                where: {
                    user_id: authUserId,
                },
            })
            .then(() => {
                Response.successResponseWithoutData(
                    res,
                    res.__("All notifications deleted"),
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

		if (!notificationData) {
            Response.successResponseWithoutData( 
				res,
				res.__("No notification found"),
				FAIL
			);
		} else {
			Notification
				.destroy({
					where: {
						user_id: authUserId,
						id: requestParam.id,
					},
				})
				.then(() => {
					Response.successResponseWithoutData(
						res,
						res.__("notification deleted"),
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
}

