const { Op } = require('sequelize')
const Response = require('../../services/Response')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,DELETE,
    YES,
    SUBSCRIPTION_PLAN_TYPE_AREA,
    USER_ROLE_TYPE
} = require('../../services/Constants')
const { SubscriptionPlan,User ,city } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */


    subscriptionPlanList: async (req, res) => {
        const requestParams = req.query
        const {authUserId} = req
        let search = false
        let query={}
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                title: {
                    [Op.like]: `%${requestParams.search}%`,
                },
            }
        }

        if (requestParams.plan_type && requestParams.plan_type !== '') {
            query = {
                ...query,
                plan_type : requestParams.plan_type,
            }
        }
        
        let sorting = [['updatedAt', 'DESC']]
        const UserData = await User.findByPk(authUserId,{
            include : [
                {model : city}
            ]
        })

        query = {
            ...query,
            user_role_type : UserData.user_role_type,
            status: {
                [Op.not]: DELETE,
            },
    
        }

        // metro non-metro added
        if(UserData.user_role_type === USER_ROLE_TYPE.company ){
            if(UserData.city.is_metro === YES){
                query = {
                    ...query,
                    plan_type_area : [SUBSCRIPTION_PLAN_TYPE_AREA.metro," "]
                }
            }
            else{
                query = {
                    ...query,
                    plan_type_area :{
                        [Op.in] : [SUBSCRIPTION_PLAN_TYPE_AREA.non_metro , null , " "]
                    } 
                }
            }
        }
        
        const options = {
            where: query,
            order: sorting
        };
        if(UserData) {
            console.log(UserData.user_role_type)
            await SubscriptionPlan.findAndCountAll(options)
                .then((data) => {
                    if (data.rows.length > 0) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__('Success')
                        )
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__('No data found'),
                            FAIL
                        )
                    }
                }, () => {
                    Response.errorResponseData(
                        res,
                        res.__('Internal error'),
                        INTERNAL_SERVER
                    )
                })

        }else
        {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('User not found'),
                FAIL
            )
        }
    }
}
