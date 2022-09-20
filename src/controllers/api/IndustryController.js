const { Op } = require('sequelize')
const Response = require('../../services/Response')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    DELETE,PER_PAGE
} = require('../../services/Constants')
const { Industry,Sector } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get role list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    IndustryList: async (req, res) => {
        const requestParams = req.query
        let search = false
        let query,limit = null;
         // limit =
         //     requestParams.per_page && requestParams.per_page > 0
         //        ? parseInt(requestParams.per_page, 10)
         //        : PER_PAGE
        if(requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0
                ? parseInt(requestParams.page, 10)
                : 1

        const offset = (pageNo - 1) * limit
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

        let sorting = [['updatedAt', 'DESC']]
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
        query ={
            ...query,
            status: {
                [Op.not]: DELETE,
            }
        }
        const options = {
            where: query,
            order: sorting,
            offset: offset
        };

           if (limit) options['limit'] = limit;
           await Industry.findAndCountAll(options)
            .then((data) => {
                if (data.rows.length > 0) {
                    const extra = []
                    extra.per_page = limit
                    extra.total = data.count
                    extra.page = pageNo
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success'),
                        extra
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
    SectorList: async (req, res) => {
        const requestParams = req.query
        let search = false
        let query,limit = null;
        if(requestParams.page) limit = 10;
        const pageNo =
            requestParams.page && requestParams.page > 0
                ? parseInt(requestParams.page, 10)
                : 1
        const offset = (pageNo - 1) * limit
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

        let sorting = [['updatedAt', 'DESC']]

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
            industry_id: requestParams.industry_id,
            status: {
                [Op.not]: DELETE,
            }
        }
        const options = {
            where: query,
            order: sorting,
            offset: offset
        };

        if(limit) options['limit'] = limit;
        await Sector.findAndCountAll(options)
            .then((data) => {
                if (data.rows.length > 0) {
                    const extra = []
                    extra.per_page = limit
                    extra.total = data.count
                    extra.page = pageNo
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success'),
                        extra
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            },(e) => {
                console.log(e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
    },

}