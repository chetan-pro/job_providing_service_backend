const { Op } = require('sequelize')
const Response = require('../../services/Response')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER
} = require('../../services/Constants')
const { Role } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */


    roleList: async(req, res) => {
        const requestParams = req.query
        let search = false
        let query = {}
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
                }
            }
        }

        query = {
            ...query,
            where: {
                show: true
            }
        }

        await Role.findAndCountAll(query)
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
    }
}