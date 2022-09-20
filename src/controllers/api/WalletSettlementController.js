const Response = require("../../services/Response");
const { WalletSettlements, WalletTransactions, User } = require("../../models");
const sequelize = require("sequelize");
const Constants = require("../../services/Constants");
const moment = require("moment");
const path = require("path");
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
    BAD_REQUEST,
} = require("../../services/Constants");
const Joi = require("@hapi/joi");
const Helper = require("../../services/Helper");
const { Op } = require("sequelize");

module.exports = {
    /**
     * @description 'This function is use to  create settlement id.'
     * @param req
     * @par am res
     * @returns {Promise<void>}
     */

    CreateSettlement: async(req, res) => {
        const reqParam = req.fields;
        const { authUserId } = req;
        let file;
        const requestObj = {
            amount: Joi.number().required(),
            transaction_id: Joi.string().optional(),
            description: Joi.string().optional(),
            file: Joi.string().optional(),
        };
        const schema = Joi.object(requestObj);
        const { error } = schema.validate(reqParam);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Create settlement: ", error))
            );
        } else {
            let userData = await User.findByPk(authUserId, {
                attributes: ["wallet_money"],
            });
            console.log("reqParam.amount >= userData.wallet_money");
            console.log(userData.wallet_money >= reqParam.amount);
            if (!(userData.wallet_money >= reqParam.amount)) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("Insufficient wallet balance"),
                    FAIL
                );
            }

            if (req.files.file && req.files.file.size > 0) {
                file = true;
            }
            if (req.files.file && req.files.file.size < 0) {
                return Response.errorResponseData(
                    res,
                    res.__("File invalid"),
                    BAD_REQUEST
                );
            }
            const FileName = file ?
                `${moment().unix()}${path.extname(req.files.file.name)}` :
                "";

            if (file) {
                try {
                    await Helper.FileUpload(
                        req,
                        res,
                        FileName,
                        Constants.IMAGESFOLDER.WALLETSETTLEMENT
                    );
                    console.log("File uploded");
                } catch (error) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Internal server error"),
                        FAIL
                    );
                }
            }

            let startUserDate = await User.findOne({ where: { id: authUserId } }).then((data) => data);
            let startDate = await WalletSettlements.findOne({ where: { user_id: authUserId } }).then((data) => data);
            var options = {
                user_id: authUserId,
                amount: reqParam.amount, // amount in the smallest currency unit
                status: "p",
                file: FileName,
                start_date: startDate ? startDate.createdAt : startUserDate.createdAt,
                transaction_id: reqParam.transaction_id,
                description: reqParam.description,
            };
            console.log("sdcoc");


            await User.update({ wallet_money: userData.wallet_money - reqParam.amount, }, { where: { id: authUserId, } })
                .then(async data => {
                    if (data) {
                        await WalletSettlements.create(options)
                            .then(data => {
                                return Response.successResponseData(
                                    res, {
                                        data,
                                        msg: "Wallet settlement requested successfully.",
                                    },
                                    res.locals.__("Success")
                                );
                            })
                            .catch(() => {
                                return Response.errorResponseWithoutData(
                                    res,
                                    res.locals.__("Error while making settlement request"),
                                    FAIL
                                );
                            });
                    } else {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__("Error while making settlement request"),
                            FAIL
                        );
                    }

                }).catch((e) => {
                    console.log("errrrrrr");
                    console.log(e);
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Error while making settlement request"),
                        FAIL
                    );

                })



        }
    },
    /**
     * @description 'This function is use to  create settlement id.'
     * @param req
     * @par am res
     * @returns {Promise<void>}
     */

    GetSettlements: async(req, res) => {
        const { page, sortBy, month, year } = req.query;
        const { authUserId } = req;
        let limit = 0;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ["id", sortBy != null ? sortBy : "DESC"]
        ];

        console.log(month);
        const options = {
            where: {
                user_id: authUserId,
            },
            offset: offset,
            order: sorting,
        };

        if (limit) options["limit"] = limit;

        if (month)
            options["where"]["$and"] = sequelize.where(
                sequelize.fn("month", sequelize.col("createdAt")),
                month
            );
        if (year)
            options["where"]["$and"] = sequelize.where(
                sequelize.fn("year", sequelize.col("createdAt")),
                year
            );

        await WalletSettlements.findAndCountAll(options).then(
            data => {
                if (data.rows.length > 0) {
                    const extra = [];
                    extra.per_page = limit;
                    extra.total = data.count;
                    extra.page = pageNo;
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Success"),
                        extra
                    );
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No data found"),
                        FAIL
                    );
                }
            },
            () => {
                Response.errorResponseData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                );
            }
        );
    },
    MakeASettlement: async(req, res) => {
        const { settlement_id, update_by, status } = req.query;

        var settlementData = await WalletSettlements.findByPk(settlement_id);

        if (!settlementData) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No settlement exits with given id"),
                FAIL
            );
        }

        if (status == "p" || status == "r") {
            await settlementData.update({
                status: status,
            });
            return Response.successResponseWithoutData(
                res,
                res.locals.__("Settlement updated successfully"),
                SUCCESS
            );
        }

        let userData = await User.findByPk(settlementData.user_id);

        if (!userData) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__(
                    "No user exits with given id " + userData.user_id
                ),
                FAIL
            );
        }

        if (settlementData.amount > userData.wallet_money) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("Insufficient wallet balance"),
                FAIL
            );
        }

        if (status == "a") {
            let isSettled = await settlementData.update({
                status: status,
            });

            if (isSettled) {
                let amountToDeduct = settlementData.amount;
                let currentWalletAmount = userData.wallet_money;

                await userData.update({
                    wallet_money: currentWalletAmount - amountToDeduct,
                });

                const walletData = {
                    user_id: userData.id,
                    previous_amount: currentWalletAmount,
                    amount: amountToDeduct,
                    total_amount: currentWalletAmount - amountToDeduct,
                    type: Constants.WALLET_TYPE.debit,
                    reason: "Settlement Request",
                    details: "Settlement Request",
                };

                await WalletTransactions.create(walletData)
                    .then(async() => {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("Settlement updated successfully"),
                            SUCCESS
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
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("Internal server error"),
                    FAIL
                );
            }
        }
    },
};