const Response = require('../../services/Response')
const { WalletTransactions, User } = require('../../models')
const sequelize = require("sequelize");
const {
    SUCCESS,
    FAIL,
    YES,
    NO,
    INTERNAL_SERVER,
    DELETE,
    PER_PAGE,
    MONTH,
    DAYS,
    MONTHLY,
    ANNUAL,
    ACTIVE,
    BAD_REQUEST
} = require('../../services/Constants')

module.exports = {
    getWalletTransaction: async(req, res) => {
        
        const { authUserId } = req;
        const { page, sortBy, month, year } = req.query;

        let limit = 0;
        if (page) limit = 10;
        const pageNo =
            page && page > 0 ?
            parseInt(page, 10) :
            1

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        const options = {
            where: {
                'user_id': authUserId,
            },
            offset: offset,
            order: sorting
        };

        if (limit) options['limit'] = limit;
        if (month) options['where']['$and'] = sequelize.where(sequelize.fn("month", sequelize.col("createdAt")), month);
        if (year) options['where']['$and'] = sequelize.where(sequelize.fn("year", sequelize.col("createdAt")), year);
        

        let walletdata = await WalletTransactions.findAndCountAll(options);

        if (!walletdata) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('Something went wrong'),
            )
        }

        if (walletdata.rows.length > 0) {
            const extra = []
            extra.per_page = limit
            extra.total = walletdata.count
            extra.page = pageNo
            return Response.successResponseData(
                res,
                walletdata,
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
    },

    getWalletAmount: async(req, res) => {
        const { authUserId } = req;
        let data = await User.findByPk(authUserId, {
            attributes: ['wallet_money']
        });
        res.json(data)
    }
}