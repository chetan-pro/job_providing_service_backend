const { Op } = require('sequelize')
const Response = require('../../services/Response')
const axios = require("axios");

const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,DELETE
} = require('../../services/Constants')
const { state,city } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */


    StateList: async (req, res) => {
        const requestParams = req.query
        let search = false
        let query={}
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    name: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }


        if (
            requestParams.filter_by_name &&
            requestParams.filter_by_name !== ''
        ) {
            query = {
                ...query,
                [Op.and]: {
                    name: requestParams.filter_by_name,
                },
            }
        }
        query = {
            ...query,
                status: {
                    [Op.not]: DELETE,
                },
        }
        const options = {
            where: query,
        };
        console.log(query)
        await state.findAndCountAll(options)
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
            },() => {
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
    },

    CityList: async (req, res) => {
        const requestParams = req.query
        let search = false
        let query={}
        if (requestParams.search && requestParams.search !== '') {
            search = true
            query = {
                ...query,
                [Op.or]: {
                    name: {
                        [Op.like]: `%${requestParams.search}%`,
                    },
                },
            }
        }


        if (
            requestParams.filter_by_name &&
            requestParams.filter_by_name !== ''
        ) {
            query = {
                ...query,
                [Op.and]: {
                    name: requestParams.filter_by_name,
                },
            }
        }
     query = {
         ...query, 
         status: {
             [Op.not]: DELETE,
         },
     }

     if(requestParams.state_id && requestParams.state_id != ''){
        query["state_id"] = {
            [Op.eq]: requestParams.state_id
        }
     }
    
     let limit = 0;
    if (requestParams.page) limit = 20;
    const pageNo = requestParams.page && requestParams.page > 0 ? parseInt(requestParams.page,10) : 20 ;
    const offset = (pageNo - 1) * limit;

   let options = {
        where:query,
        offset : offset
    }
    if (limit) options['limit'] = limit;

        await city.findAndCountAll(options)
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
            },() => {
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },

    PinCodeDetailList:async(req,res) =>{
        const { pin_code }  = req.query;
        console.log("pin_code :: ", pin_code); 
        let url = `http://www.postalpincode.in/api/pincode/${pin_code}`;
        console.log( " :: : url  : ", url);
        axios.get(url)
        .then(done => res.send({data : done.data}))
        .catch(er => res.send({ error : er.MessageDetail}))
    }
}