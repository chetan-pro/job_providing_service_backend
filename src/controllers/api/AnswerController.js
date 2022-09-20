const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    DELETE,PER_PAGE,
    ACTIVE,BAD_REQUEST
} = require('../../services/Constants')
const { Question,Answers } = require('../../models')


module.exports = {

    AddJobPostAnswer: async (req, res) => {
        const requestIdParam = req.params;
		const requestParam = req.body;
		const { authUserId } = req;

        await Question.findOne({
			where : {
				id : requestIdParam.queId,
			}
		})
        .then(async data =>{

            if(data){
                const reqObj = {
                    answer: Joi.string().required(),
                };
                
                const schema = Joi.object(reqObj);
                const { error } = schema.validate(requestParam);
        
                if (error) {
                    return Response.validationErrorResponseData(
                        res,
                        res.__(Helper.validationMessageKey("Job post answer validation", error))
                    );
                } else {
                    if (requestParam.answer && requestParam.answer !== "") {
                        const questionObj = {
                            where:{
                                answer: requestParam.answer,
                                user_id: authUserId ,
                                question_id: requestIdParam.queId,
                            },
                        };

                        console.log("reqObj",questionObj);

                        await Answers
                            .findOrCreate(questionObj)
                            .then(async result => {

                                if(result[1]){
                                    return Response.successResponseData(
                                        res,
                                        result[0],
                                        SUCCESS,
                                        res.locals.__("Job post answer added successfully")
                                    );
                                }else{
                                    return Response.errorResponseWithoutData(
                                        res,
                                        res.locals.__("Job post answer already exists"),
                                        FAIL
                                    )
                                }
                            })
                            .catch(e => {
                                console.log(e);
                                return Response.errorResponseData(
                                    res,
                                    res.__("Something Went Wrong")
                                );
                            });
                    }
                }
            }else{
                return Response.errorResponseWithoutData(
					res,
					res.locals.__("No question found"),
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

    // UpdateJobPostQuestion: async(req,res)=>{
    // }

}