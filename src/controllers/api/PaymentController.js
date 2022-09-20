const Response = require("../../services/Response");
const Razorpay = require("razorpay");
const {
    TransactionHistory,
    SubscribedUser,
    SubscriptionPlan,
    WalletTransactions,
    User,
    city,
    UserReferral
} = require("../../models");
const Constants = require("../../services/Constants");
const Joi = require("@hapi/joi");
const addSubtractDate = require("add-subtract-date");
const Helper = require("../../services/Helper");
const moment = require("moment");
var crypto = require("crypto");
const { type } = require("os");
const { obj } = require("pumpify");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");

const {
    ACTIVE,
    DELETE,
    INACTIVE,
    SUCCESS,
    FAILED,
    FAIL,
    INTERNAL_SERVER,
    JobPost,
    YES,
    SUBSCRIPTION_PLAN_TYPE,
    PAYMENT_TYPE
} = require("../../services/Constants");
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.SECRET_KEY,
});

module.exports = {
    /**
     * @description 'This function is use to  create order id.'
     * @param req
     * @par am res
     * @returns {Promise<void>}
     */
    CreateOrderId: async(req, res) => {

        console.log(" :   knto it ::", req.body);

        const requestParams = req.body;
        const { authUserId } = req;
        const reqObj = {
            total_amount: Joi.number().required(),
            e_amount: Joi.number().required(),
            wallet_amount: Joi.number().required(),
            currency: Joi.string().optional(),
            receipt: Joi.string().required(),
            plan_id: Joi.number().required(),
            type: Joi.string()
                .required()
                .valid(
                    Constants.PAYMENT_TYPE.razorpay,
                    Constants.PAYMENT_TYPE.wallet,
                    Constants.PAYMENT_TYPE.both
                ),
        };
        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(requestParams);
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Sign up validation", error))
            );
        } else {
            var options = {
                currency: requestParams.currency ?
                    requestParams.currency : "INR",
                receipt: requestParams.receipt,
            };
            if (requestParams.type == Constants.PAYMENT_TYPE.wallet) {
                options["amount"] = requestParams.wallet_amount * 100;
            } else {
                options["amount"] = requestParams.e_amount * 100;
            }

            await instance.orders.create(options, async function(err, order) {
                if (err) {
                    console.log(err);
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Something went wrong")
                    );
                } else {
                    let traObj = {
                        order_id: order.id,
                        user_id: authUserId,
                        total_amount: requestParams.total_amount,
                        wallet_amount: requestParams.wallet_amount,
                        e_amount: requestParams.e_amount,
                        plan_id: requestParams.plan_id,
                        currency: order.currency,
                        payment_type: requestParams.type,
                    };

                    console.log(" :   err 108 ::", traObj);

                    await TransactionHistory.create(traObj)
                        .then(async result => {

                            console.log(" :   err 113 ::", result);
                            if (result) {
                                return Response.successResponseData(
                                    res,
                                    result,
                                    res.locals.__("Success")
                                );
                            } else {
                                return Response.successResponseData(
                                    res,
                                    result,
                                    res.locals.__("Not Found")
                                );
                            }
                        })
                        .catch(e => {
                            console.log(e);
                            return Response.errorResponseData(
                                res,
                                res.__("Something went wrong")
                            );
                        });
                }
            });
        }
    },

    // old =>
    VerifyPayment: async(req, res) => {
        const body = req.body;
        const { authUserId } = req;
        const reqObj = {
            signature: Joi.string().optional(),
            payment_id: Joi.string().optional(),
            payment_status: Joi.string().required(),
            message: Joi.string().optional(),
            plan_id: Joi.number().required(),
            total_amount: Joi.number().required(),
            e_amount: Joi.number().required(),
            wallet_amount: Joi.number().required(),
            currency: Joi.string().optional(),
            type: Joi.string().required().valid(Constants.PAYMENT_TYPE.razorpay, Constants.PAYMENT_TYPE.wallet, Constants.PAYMENT_TYPE.both),
        };

        if (body.type == "E" || body.type == "EW") {
            reqObj["order_id"] = Joi.string().required();
        }

        const subscriptionDetails = await SubscriptionPlan.findByPk(body.plan_id);

        const SubscribedUserOptions = {
            user_id: authUserId,
            plan_type: subscriptionDetails.plan_type,
            status: ACTIVE,
            expiry_date: {
                [Op.gt]: moment(),
            }
        }

        const UserExistingPlans = await SubscribedUser.findOne({ where: SubscribedUserOptions });

        if (subscriptionDetails.plan_type.trim() === SUBSCRIPTION_PLAN_TYPE.limit_extension_plan) {

            SubscribedUserOptions.plan_type = SUBSCRIPTION_PLAN_TYPE.validity_plan;
            const ExistingValidityplan = await SubscribedUser.findOne({ where: SubscribedUserOptions });

            if (!ExistingValidityplan) {
                return Response.errorResponseWithoutData(
                    res,
                    res.__("No active Validity Plan found hence you can not buy this plan"),
                    FAIL
                )
            }
        }


        const schema = Joi.object(reqObj);
        const { error } = await schema.validate(body);
        if (error) {
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Sign up validation", error))
            );
        } else {
            // payment through wallet
            if (body.type == "W") {
                let walletData = await User.findByPk(authUserId);

                if (walletData.wallet_money < body.wallet_amount) {
                    return Response.errorResponseData(
                        res,
                        res.locals.__("wallet amount is not enough to make this payment")
                    );
                } else {
                    // intilized payment
                    let userData = await User.findByPk(authUserId);

                    if (!userData) {
                        return Response.errorResponseData(
                            res,
                            res.locals.__("Invalid user")
                        );
                    }

                    await userData.update({
                        wallet_money: userData.wallet_money - body.wallet_amount,
                    });

                    var response = { signatureIsValid: "false" };

                    let traObj = {
                        order_id: "order_" + Helper.randomOrderId(14),
                        user_id: authUserId,
                        total_amount: body.total_amount,
                        wallet_amount: body.wallet_amount,
                        payment_type: body.type,
                        plan_id: body.plan_id,
                        currency: body.currency ? body.currency : "INR",
                        payment_status: Constants.SUCCESSED,
                        payment_json_response: JSON.stringify(response),
                        status: Constants.DONE,
                        cron_update: "N",
                        subscribed_user_id: null
                    };

                    traObj["payment_json_request"] = JSON.stringify(traObj);

                    await TransactionHistory.create(traObj)
                        .then(async result => {
                            if (result) {
                                let start_date, expiry_date;
                                const PlanData = await SubscriptionPlan.findByPk(body.plan_id);
                                const userPlanData = await SubscribedUser.findByPk(authUserId, { where: { status: Constants.ACTIVE }, });

                                if (userPlanData) {
                                    start_date = userPlanData.expiry_date;
                                    expiry_date = moment(userPlanData.expiry_date).add(PlanData.expiry_days, "d");
                                    console.log("if :::: start_date :::, ", start_date, " ::: expiry_date ::: ", expiry_date);
                                } else {
                                    start_date = new Date();
                                    expiry_date = moment(start_date).add(PlanData.expiry_days, "d");
                                    console.log("else :::: start_date :::, ", start_date, " ::: expiry_date ::: ", expiry_date);
                                }

                                console.log("UserExistingPlans ::: ,", UserExistingPlans);

                                // if the plan is a limit extension Plan
                                if (subscriptionDetails.plan_type.trim() === SUBSCRIPTION_PLAN_TYPE.limit_extension_plan) {

                                    SubscribedUserOptions.plan_type = SUBSCRIPTION_PLAN_TYPE.validity_plan;
                                    const ExistingValidityplan = await SubscribedUser.findOne({ where: SubscribedUserOptions });

                                    if (!ExistingValidityplan) {
                                        return Response.errorResponseWithoutData(
                                            res,
                                            res.__("No active Validity Plan found hence you can not buy this plan"),
                                            FAIL
                                        )
                                    }

                                    console.log(" ::: into this ExistingValidityplan ::", ExistingValidityplan);

                                    ExistingValidityplan.job_limit = subscriptionDetails.job_limit ? ExistingValidityplan.job_limit + subscriptionDetails.job_limit : ExistingValidityplan.job_limit

                                    ExistingValidityplan.save();

                                    result.subscribed_user_id = ExistingValidityplan.id
                                    result.save();

                                    return Response.successResponseData(
                                        res,
                                        ExistingValidityplan,
                                        res.locals.__("Limits has been Exceeded in the current active Validity plan")
                                    );
                                }

                                // activation of the connected pans if exists
                                let freePlanId;
                                if (subscriptionDetails.connected_plan_id) {
                                    await SubscriptionPlan.findByPk(subscriptionDetails.connected_plan_id, {
                                        where: {
                                            status: ACTIVE
                                        }
                                    }).then(async data => {
                                        if (data) {
                                            SubscribedUserOptions.plan_type = data.plan_type;
                                            const ExistingPlanDetail = await SubscribedUser.findOne({ where: SubscribedUserOptions });
                                            const freePlanData = {
                                                user_id: authUserId,
                                                plan_id: data.id,
                                                start_date: ExistingPlanDetail ? null : start_date,
                                                expiry_date: ExistingPlanDetail ? null : expiry_date,
                                                job_limit: data.job_limit ? data.job_limit : 0,
                                                email_limit: data.email_limit ? data.email_limit : 0,
                                                cv_limit: data.cv_limit ? data.cv_limit : 0,
                                                plan_type: data.plan_type,
                                                job_boosting_days: data.job_boosting_days ? data.job_boosting_days : 0,
                                                status: ExistingPlanDetail ? Constants.INACTIVE : Constants.ACTIVE,
                                                free_plan_id: null,
                                            };

                                            await SubscribedUser.create(freePlanData).then(async result => {
                                                if (!result) {
                                                    return Response.errorResponseData(
                                                        res,
                                                        res.__("Something went wrong")
                                                    );
                                                } else {
                                                    freePlanId = await result.id;
                                                }
                                            })


                                        } else {
                                            return Response.errorResponseWithoutData(
                                                res,
                                                res.locals.__("Connected Plan details not found ,Hence you are not allowed to subscribe this plan"),
                                                FAIL
                                            );
                                        }
                                    }).catch(err => {
                                        console.log(" :: error :: ", err);
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Something went wrong")
                                        );
                                    })

                                }

                                const subUserObj = {
                                    user_id: authUserId,
                                    plan_id: body.plan_id,
                                    start_date: UserExistingPlans ? null : start_date,
                                    expiry_date: UserExistingPlans ? null : expiry_date,
                                    job_limit: subscriptionDetails.job_limit ? subscriptionDetails.job_limit : 0,
                                    email_limit: subscriptionDetails.email_limit ? subscriptionDetails.email_limit : 0,
                                    cv_limit: subscriptionDetails.cv_limit ? subscriptionDetails.cv_limit : 0,
                                    plan_type: subscriptionDetails.plan_type,
                                    job_boosting_days: subscriptionDetails.job_boosting_days ? subscriptionDetails.job_boosting_days : 0,
                                    status: UserExistingPlans ? Constants.INACTIVE : Constants.ACTIVE,
                                    free_plan_id: freePlanId ? freePlanId : null
                                };
                                await SubscribedUser.create(subUserObj)
                                    .then(async result => {
                                        if (result) {
                                            let userData = await User.findByPk(
                                                authUserId
                                            );
                                            if (!userData) {
                                                return Response.errorResponseData(
                                                    "Invalid user",
                                                    res.__(
                                                        "Something went wrong"
                                                    )
                                                );
                                            }

                                            let walletData =
                                                await WalletTransactions.findOne({
                                                    where: {
                                                        user_id: authUserId,
                                                        details: "CashBack",
                                                    },
                                                });
                                            if (walletData && walletData != "") {
                                                let amount_to_add = await Helper.calculateCashBack(body.total_amount, 10);
                                                await User.update({ wallet_money: (+userData.wallet_money + (+amount_to_add)), }, { where: { id: authUserId, }, returning: true, plain: true, })
                                                    .then(async function(data) {
                                                        const walletData = {
                                                            user_id: authUserId,
                                                            previous_amount: userData.wallet_money,
                                                            amount: amount_to_add,
                                                            total_amount: userData.wallet_money + amount_to_add,
                                                            type: Constants.WALLET_TYPE.credit,
                                                            reason: "Subscription CashBack",
                                                            details: "CashBack",
                                                        };

                                                        await WalletTransactions.create(walletData)
                                                            .then(async() => {
                                                                return Response.successResponseData(
                                                                    res,
                                                                    result,
                                                                    res.locals.__("Payment is successful")
                                                                );
                                                            })
                                                            .catch(e => {
                                                                console.log(e);
                                                                return Response.errorResponseData(
                                                                    res,
                                                                    res.__("Something went wrong")
                                                                );
                                                            });
                                                    })
                                                    .catch(e => {
                                                        console.log(e);
                                                        return Response.errorResponseData(
                                                            res,
                                                            res.__("something Went Wrong")
                                                        );
                                                    });
                                            }

                                            return Response.successResponseData(
                                                res,
                                                response,
                                                res.locals.__("Payment is successful")
                                            );
                                        }
                                    })
                                    .catch(e => {
                                        console.log(e);
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Something went wrong")
                                        );
                                    });
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__("Something went wrong")
                                );
                            }
                        })
                        .catch(e => {
                            console.log(e);
                            return Response.errorResponseData(
                                res,
                                res.__("Something went wrong")
                            );
                        });
                }
            } else {

                await TransactionHistory.findOne({
                        where: {
                            order_id: body.order_id,
                        },
                    })
                    .then(async TraData => {
                        if (TraData) {
                            const requestData = JSON.stringify(body);
                            try {
                                let data = await TransactionHistory.update({ payment_json_request: requestData }, {
                                    where: { order_id: body.order_id },
                                }).then(updateData => updateData);
                            } catch (e) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__("Something went wrong")
                                );
                            }

                            if (body.payment_status === Constants.SUCCESSED) {

                                const verifydata = body.order_id + "|" + body.payment_id;
                                var expectedSignature = crypto.createHmac("sha256", process.env.SECRET_KEY).update(verifydata.toString()).digest("hex");
                                console.log("expectedSignature ::,", expectedSignature);

                                var response = { signatureIsValid: "false" };
                                if (expectedSignature === body.signature) {
                                    response = { signatureIsValid: "true" };
                                    const Obj = {
                                        tnx_id: body.payment_id,
                                        plan_id: body.plan_id,
                                        payment_status: body.payment_status,
                                        status: "done",
                                        cron_update: "N",
                                        user_id: authUserId,
                                        payment_json_response: JSON.stringify(response),
                                    };

                                    // if user uses both wallet and raxzorapy
                                    if (body.type == "EW") {
                                        let userData = await User.findByPk(authUserId);
                                        if (!userData) {
                                            return Response.errorResponseData(
                                                res,
                                                res.locals.__("Invalid user")
                                            );
                                        }

                                        await WalletTransactions.create({
                                            user_id: authUserId,
                                            previous_amount: userData.wallet_money,
                                            amount: body.wallet_amount,
                                            total_amount: userData.wallet_money - body.wallet_amount,
                                            type: "Debit",
                                            reason: "Subcription",
                                            details: "subscription",
                                        });

                                        await userData.update({ wallet_money: userData.wallet_money - body.wallet_amount, });
                                        userData.save();
                                    }

                                    TransactionHistory.update(Obj, {
                                        where: { order_id: body.order_id },
                                    }).then(async updateData => {
                                        if (updateData) {
                                            let start_date, expiry_date;
                                            const PlanData = await SubscriptionPlan.findByPk(body.plan_id);
                                            const userPlanData = await SubscribedUser.findByPk(authUserId, {
                                                where: {
                                                    status: Constants.ACTIVE,
                                                },
                                            });
                                            if (userPlanData) {
                                                console.log("if ::: ");
                                                start_date = userPlanData.expiry_date;
                                                expiry_date = moment(userPlanData.expiry_date).add(PlanData.expiry_days, "d");
                                                console.log(start_date);
                                                console.log(expiry_date);
                                                console.log(PlanData.expiry_days);
                                            } else {
                                                start_date = new Date();
                                                expiry_date = moment(start_date).add(PlanData.expiry_days, "d");
                                                console.log("new", start_date);
                                                console.log("new", expiry_date);
                                                console.log(PlanData.expiry_days);
                                            }

                                            // if the plan is a limit extension Plan
                                            if (subscriptionDetails.plan_type.trim() === SUBSCRIPTION_PLAN_TYPE.limit_extension_plan) {

                                                SubscribedUserOptions.plan_type = SUBSCRIPTION_PLAN_TYPE.validity_plan;
                                                const ExistingValidityplan = await SubscribedUser.findOne({ where: SubscribedUserOptions });

                                                if (!ExistingValidityplan) {
                                                    return Response.errorResponseWithoutData(
                                                        res,
                                                        res.__("No active Validity Plan found hence you can not buy this plan"),
                                                        FAIL
                                                    )
                                                }

                                                ExistingValidityplan.job_limit = subscriptionDetails.job_limit ? ExistingValidityplan.job_limit + subscriptionDetails.job_limit : ExistingValidityplan.job_limit

                                                await ExistingValidityplan.save();

                                                TraData.subscribed_user_id = ExistingValidityplan.id
                                                await TraData.save();

                                                return Response.successResponseData(
                                                    res,
                                                    ExistingValidityplan,
                                                    SUCCESS,
                                                    res.locals.__("Job limits has been Exceeded in the current active Validity plan")
                                                );
                                            }

                                            // activation of the connected pans if exists
                                            let freePlanId;
                                            if (subscriptionDetails.connected_plan_id) {
                                                await SubscriptionPlan.findByPk(subscriptionDetails.connected_plan_id, {
                                                    where: {
                                                        status: ACTIVE
                                                    }
                                                }).then(async data => {
                                                    if (data) {

                                                        SubscribedUserOptions.plan_type = data.plan_type;
                                                        const ExistingPlanDetail = await SubscribedUser.findOne({ where: SubscribedUserOptions });

                                                        const freePlanData = {
                                                            user_id: authUserId,
                                                            plan_id: data.id,
                                                            start_date: ExistingPlanDetail ? null : start_date,
                                                            expiry_date: ExistingPlanDetail ? null : expiry_date,
                                                            job_limit: data.job_limit ? data.job_limit : 0,
                                                            email_limit: data.email_limit ? data.email_limit : 0,
                                                            cv_limit: data.cv_limit ? data.cv_limit : 0,
                                                            plan_type: data.plan_type,
                                                            job_boosting_days: data.job_boosting_days ? data.job_boosting_days : 0,
                                                            status: ExistingPlanDetail ? Constants.INACTIVE : Constants.ACTIVE,
                                                            free_plan_id: null,
                                                        };

                                                        await SubscribedUser.create(freePlanData).then(async result => {

                                                            if (!result) {
                                                                return Response.errorResponseData(
                                                                    res,
                                                                    res.__("Something went wrong")
                                                                );
                                                            }

                                                            freePlanId = await result.id;
                                                            console.log(" :; result.id :: ", result.id, " ::: freePlanId :: ", freePlanId);

                                                        })


                                                    } else {
                                                        return Response.errorResponseWithoutData(
                                                            res,
                                                            res.locals.__("Connected Plan details not found ,Hence you are not allowed to subscribe this plan"),
                                                            FAIL
                                                        );
                                                    }
                                                }).catch(err => {
                                                    console.log(" :: error :: ", err);
                                                    return Response.errorResponseData(
                                                        res,
                                                        res.__("Something went wrong")
                                                    );
                                                })

                                            }

                                            const subUserObj = {
                                                user_id: authUserId,
                                                plan_id: body.plan_id,
                                                start_date: UserExistingPlans ? null : start_date,
                                                expiry_date: UserExistingPlans ? null : expiry_date,
                                                job_limit: subscriptionDetails.job_limit ? subscriptionDetails.job_limit : 0,
                                                email_limit: subscriptionDetails.email_limit ? subscriptionDetails.email_limit : 0,
                                                cv_limit: subscriptionDetails.cv_limit ? subscriptionDetails.cv_limit : 0,
                                                plan_type: subscriptionDetails.plan_type,
                                                job_boosting_days: subscriptionDetails.job_boosting_days ? subscriptionDetails.job_boosting_days : 0,
                                                status: UserExistingPlans ? Constants.INACTIVE : Constants.ACTIVE,
                                                free_plan_id: freePlanId ? freePlanId : null
                                            };

                                            await SubscribedUser.create(subUserObj)
                                                .then(async result => {
                                                    if (result) {
                                                        let userData =
                                                            await User.findByPk(
                                                                authUserId
                                                            );

                                                        if (!userData) {
                                                            return Response.errorResponseData("Invalid user", res.__("Something went wrong"));
                                                        }

                                                        let walletData = await WalletTransactions.findOne({
                                                            where: { user_id: authUserId, details: "CashBack", },
                                                        });

                                                        if (!(walletData && walletData != "")) {
                                                            let amount_to_add = await Helper.calculateCashBack(body.total_amount, 10);

                                                            await User.update({
                                                                    wallet_money: ((+userData.wallet_money) + (+amount_to_add)),
                                                                }, {
                                                                    where: {
                                                                        id: authUserId,
                                                                    },
                                                                    returning: true,
                                                                    plain: true,
                                                                })
                                                                .then(
                                                                    async function(
                                                                        data
                                                                    ) {
                                                                        const walletData = {
                                                                            user_id: authUserId,
                                                                            previous_amount: userData.wallet_money,
                                                                            amount: amount_to_add,
                                                                            total_amount: userData.wallet_money +
                                                                                amount_to_add,
                                                                            type: Constants
                                                                                .WALLET_TYPE
                                                                                .credit,
                                                                            reason: "Subscription CashBack",
                                                                            details: "CashBack",
                                                                        };

                                                                        await WalletTransactions.create(
                                                                                walletData
                                                                            )
                                                                            .then(
                                                                                async() => {
                                                                                    return Response.successResponseData(
                                                                                        res,
                                                                                        response,
                                                                                        res.locals.__(
                                                                                            "Payment is successful"
                                                                                        )
                                                                                    );
                                                                                }
                                                                            )
                                                                            .catch(
                                                                                e => {
                                                                                    console.log(
                                                                                        e
                                                                                    );
                                                                                    return Response.errorResponseData(
                                                                                        res,
                                                                                        res.__(
                                                                                            "Something went wrong"
                                                                                        )
                                                                                    );
                                                                                }
                                                                            );
                                                                    }
                                                                )
                                                                .catch(e => {
                                                                    console.log(
                                                                        e
                                                                    );
                                                                    return Response.errorResponseData(
                                                                        res,
                                                                        res.__(
                                                                            "Something went wrong"
                                                                        )
                                                                    );
                                                                });
                                                        }

                                                        return Response.successResponseData(
                                                            res,
                                                            response,
                                                            res.locals.__(
                                                                "Payment is successful"
                                                            )
                                                        );
                                                    }
                                                })
                                                .catch(e => {
                                                    console.log(
                                                        "*************",
                                                        e
                                                    );
                                                    return Response.errorResponseData(
                                                        res,
                                                        res.__(
                                                            "Something went wrong"
                                                        )
                                                    );
                                                });
                                        } else {
                                            return Response.errorResponseData(
                                                res,
                                                res.locals.__(
                                                    "Something went wrong"
                                                )
                                            );
                                        }
                                    });
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.__("Invalid signature")
                                    );
                                }
                            }
                            if (body.payment_status === Constants.FAILED) {
                                response = { response: "Payment Failed" };
                                const Obj = {
                                    plan_id: body.plan_id,
                                    payment_json_response: JSON.stringify(response),
                                    payment_status: body.payment_status,
                                    status: "cancel",
                                    cron_update: "N",
                                };
                                TransactionHistory.update(Obj, {
                                    where: { order_id: body.order_id },
                                }).then(async updateData => {
                                    if (updateData) {
                                        return Response.errorResponseData(
                                            res,
                                            res.__("Payment failed")
                                        );
                                    } else {
                                        return Response.errorResponseData(
                                            res,
                                            res.locals.__(
                                                "Something went wrong"
                                            )
                                        );
                                    }
                                });
                            }
                        } else {
                            return Response.successResponseWithoutData(
                                res,
                                res.locals.__("Order not available")
                            );
                        }
                    })
                    .catch(error => console.log("::: error :: ,", error));
            }
        }
    },

    // new =>
    paymentVerify: async(req, res) => {
        const body = req.body;
        const { authUserId } = req;
        const reqObj = {
            signature: Joi.string().optional(),
            payment_id: Joi.string().optional(),
            payment_status: Joi.string().required(),
            message: Joi.string().optional(),
            plan_id: Joi.number().required(),
            total_amount: Joi.number().required(),
            e_amount: Joi.number().required(),
            wallet_amount: Joi.number().required(),
            currency: Joi.string().optional(),
            type: Joi.string().required().valid(Constants.PAYMENT_TYPE.razorpay, Constants.PAYMENT_TYPE.wallet, Constants.PAYMENT_TYPE.both),
        };
        let debitSubscription;
        if (body.type == "E" || body.type == "EW") {
            reqObj["order_id"] = Joi.string().required();
        }

        // loggedIn userData (walletData => UserData)
        let UserData = await User.findByPk(authUserId, {
            include: {
                model: city
            }
        });
        if (!UserData) {
            return Response.errorResponseData(
                res,
                res.locals.__("Invalid user")
            );
        }

        // buying plan (details)
        const subscriptionDetails = await SubscriptionPlan.findByPk(body.plan_id);
        if (!subscriptionDetails) {
            return Response.errorResponseWithoutData(
                res,
                res.__("No Plan Found With given plan id"),
                FAIL
            )
        }

        // user active plan Detail options
        const SubscribedUserOptions = {
            user_id: authUserId,
            plan_type: subscriptionDetails.plan_type,
            status: ACTIVE,
            expiry_date: {
                [Op.gt]: moment(),
            },
        }

        // user active plan Detail
        const UserExistingPlans = await SubscribedUser.findOne({
            where: SubscribedUserOptions,
            include: [{
                model: SubscriptionPlan,
                required: true,
                where: {
                    user_role_type: UserData.user_role_type
                }
            }]
        });

        // if user tries to buy a limit extension plan , but have no active validity plan
        let ExistingValidityplan;
        if (subscriptionDetails.plan_type.trim() === SUBSCRIPTION_PLAN_TYPE.limit_extension_plan) {
            SubscribedUserOptions.plan_type = SUBSCRIPTION_PLAN_TYPE.validity_plan;
            ExistingValidityplan = await SubscribedUser.findOne({ where: SubscribedUserOptions });
            if (!ExistingValidityplan) {
                return Response.errorResponseWithoutData(
                    res,
                    res.__("No active Validity Plan found hence you can not buy this plan"),
                    FAIL
                )
            }
        }

        // global transaction Options
        var response = { signatureIsValid: "false" };
        let traObj = {
            user_id: authUserId,
            total_amount: body.total_amount,
            wallet_amount: body.wallet_amount,
            payment_type: body.type,
            plan_id: body.plan_id,
            currency: body.currency ? body.currency : "INR",
            payment_status: Constants.SUCCESSED,
            payment_json_response: JSON.stringify(response),
            status: Constants.DONE,
            cron_update: "N",
            subscribed_user_id: null
        };
        traObj["payment_json_request"] = JSON.stringify(traObj);

        // wallet transactionGlobal
        let walletTransactionObj = {
            user_id: authUserId,
            previous_amount: UserData.wallet_money,
            amount: body.wallet_amount,
            total_amount: UserData.wallet_money - body.wallet_amount,
            type: "Debit",
            reason: "Subcription",
            details: "subscription",
        }

        // cashBack wallet Data
        // let walletData = await WalletTransactions.findOne({ where: { user_id: authUserId, details: "CashBack" } });
        // cashBack amount
        // let amount_to_add = await Helper.calculateCashBack(body.total_amount, 10);

        let finalTransactionHistory;
        const schema = Joi.object(reqObj);
        const { error } = schema.validate(body);

        if (error) {
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Subscription validation", error))
            );
        }

        let TraData;
        // let cashBackWalletTransaction;
        if (body.type == PAYMENT_TYPE.wallet) {
            // check if the wallet have enough money 
            if (UserData.wallet_money < body.wallet_amount) {
                return Response.errorResponseData(
                    res,
                    res.locals.__("wallet amount is not enough to make this payment")
                );
            }
            // intilized payment
            // UserData.update({ wallet_money: UserData.wallet_money - body.wallet_amount });
            traObj["order_id"] = "order_" + Helper.randomOrderId(14),
                finalTransactionHistory = await TransactionHistory.create(traObj);

            // cashBack
            // if (subscriptionDetails.cashback_amount) {

            // console.log(" :: wallet dtata before receivign the cashback :: ", UserData.wallet_money);

            //we writed this previously but this is not used currently thats why we comment out this
            // walletTransactionObj = {
            //     user_id: authUserId,
            //     previous_amount: UserData.wallet_money,
            //     amount: subscriptionDetails.cashback_amount,
            //     total_amount: UserData.wallet_money + subscriptionDetails.cashback_amount,
            //     type: Constants.WALLET_TYPE.credit,
            //     reason: "Subscription CashBack",
            //     details: "CashBack",
            // }
            // cashBackWalletTransaction = await WalletTransactions.create(walletTransactionObj)
            //     .catch(e => {
            //         console.log(e);
            //         return Response.errorResponseData(
            //             res,
            //             res.__("Something went wrong")
            //         );
            //     });

            // await UserData.update({ wallet_money: Number(UserData.wallet_money) + Number(subscriptionDetails.cashback_amount) });
            // UserData = await User.findByPk(authUserId, {
            //     include: {
            //         model: city
            //     }
            // });

            // createing a debit on buying a subscription
            walletTransactionObj = {
                user_id: authUserId,
                previous_amount: UserData.wallet_money,
                amount: body.wallet_amount,
                total_amount: UserData.wallet_money - body.wallet_amount,
                type: "Debit",
                reason: "Subcription",
                details: "subscription",
            }

            debitSubscription = await WalletTransactions.create(walletTransactionObj);
            await UserData.update({ wallet_money: UserData.wallet_money - body.wallet_amount });
            UserData.save();

            // console.log(" :: UserData :: ", UserData);
            // }
        } else {

            // if (subscriptionDetails.cashback_amount) {

            //     console.log(" :: wallet dtata before receivign the cashback :: ", UserData.wallet_money);


            //     walletTransactionObj = {
            //         user_id: authUserId,
            //         previous_amount: UserData.wallet_money,
            //         amount: subscriptionDetails.cashback_amount,
            //         total_amount: UserData.wallet_money + subscriptionDetails.cashback_amount,
            //         type: Constants.WALLET_TYPE.credit,
            //         reason: "Subscription CashBack",
            //         details: "CashBack",
            //     }
            //     cashBackWalletTransaction = await WalletTransactions.create(walletTransactionObj)
            //         .catch(e => {
            //             console.log(e);
            //             return Response.errorResponseData(
            //                 res,
            //                 res.__("Something went wrong")
            //             );
            //         });

            //     await UserData.update({ wallet_money: Number(UserData.wallet_money) + Number(subscriptionDetails.cashback_amount) });
            //     UserData = await User.findByPk(authUserId, {
            //         include: {
            //             model: city
            //         }
            //     });

            //     console.log(" :: UserData :: ", UserData);
            // }

            // else part if  other than W
            TraData = await TransactionHistory.findOne({ where: { order_id: body.order_id } })
            if (!TraData) {
                return Response.errorResponseData(
                    res,
                    res.locals.__("Order Id not available")
                );
            }

            UserData.update({ wallet_money: UserData.wallet_money - body.wallet_amount });
            if (body.payment_status === Constants.SUCCESSED) {

                const verifydata = body.order_id + "|" + body.payment_id;
                var expectedSignature = crypto.createHmac("sha256", process.env.SECRET_KEY).update(verifydata.toString()).digest("hex");

                console.log("expectedSignature ::,", expectedSignature);

                if (expectedSignature === body.signature) {
                    response = { signatureIsValid: "true" };
                    traObj["tnx_id"] = body.payment_id
                    traObj["order_id"] = body.order_id

                    // if user uses both wallet and raxzorapy
                    if (body.type == PAYMENT_TYPE.both) {
                        await WalletTransactions.create(walletTransactionObj);
                        await UserData.update({ wallet_money: UserData.wallet_money - body.wallet_amount });
                        UserData.save();
                    }

                    let updatedData = await TransactionHistory.update(traObj, { where: { order_id: body.order_id } })
                    if (!updatedData) {
                        console.log(" :: 1623 :: stuck", updatedData);
                        return Response.errorResponseData(
                            res,
                            res.locals.__("Something went wrong")
                        );
                    }

                } else {
                    return Response.errorResponseData(
                        res,
                        res.__("Invalid signature")
                    );
                }
            }

            if (body.payment_status === Constants.FAILED) {
                response = { response: "Payment Failed" };
                traObj["order_id"] = body.order_id
                traObj["payment_status"] = body.payment_status,
                    traObj["status"] = "cancel"

                let updateData = await TransactionHistory.update(traObj, { where: { order_id: body.order_id }, })
                if (updateData) {
                    return Response.errorResponseData(
                        res,
                        res.__("Payment failed")
                    );
                } else {
                    console.log(" :: 1650 :: stuck", updateData);
                    return Response.errorResponseData(
                        res,
                        res.locals.__("Something went wrong")
                    );
                }
            }
        }

        UserData = await User.findByPk(authUserId, {
            include: {
                model: city
            }
        });

        console.log(" :: wallet dtata after receivign the cashback :: ", UserData.wallet_money);



        // after successfull payment history creation and wallet transaction
        let start_dates = new Date();
        let expiry_dates = moment(start_dates).add(subscriptionDetails.expiry_days, "d");

        console.log(" :: UserExistingPlans :: , ", UserExistingPlans);

        // if the plan is a limit extension Plan
        if (subscriptionDetails.plan_type.trim() === SUBSCRIPTION_PLAN_TYPE.limit_extension_plan) {

            ExistingValidityplan.job_limit = subscriptionDetails.job_limit ? ExistingValidityplan.job_limit + subscriptionDetails.job_limit : ExistingValidityplan.job_limit

            await ExistingValidityplan.save();

            finalTransactionHistory.subscribed_user_id = ExistingValidityplan.id
            await finalTransactionHistory.save();

            return Response.successResponseData(
                res,
                ExistingValidityplan,
                SUCCESS,
                res.locals.__("Job limits has been Exceeded in the current active Validity plan")
            );
        }

        // activation of the connected plans if exists
        let freePlanId;
        let connected_plan_id;
        if (subscriptionDetails.connected_free_metro_plan_id || subscriptionDetails.connected_free_non_metro_plan_id) {
            UserData.city.is_metro === YES ? connected_plan_id = await subscriptionDetails.connected_free_metro_plan_id : connected_plan_id = await subscriptionDetails.connected_free_non_metro_plan_id;
        }

        if (connected_plan_id) {
            await SubscriptionPlan.findByPk(connected_plan_id, {
                where: { status: ACTIVE }
            }).then(async data => {
                if (data) {

                    SubscribedUserOptions.plan_type = data.plan_type;
                    const ExistingPlanDetail = UserExistingPlans;

                    const freePlanData = {
                        user_id: authUserId,
                        plan_id: data.id,
                        start_date: ExistingPlanDetail ? null : start_dates,
                        expiry_date: ExistingPlanDetail ? null : expiry_dates,
                        job_limit: data.job_limit ? data.job_limit : 0,
                        email_limit: data.email_limit ? data.email_limit : 0,
                        cv_limit: data.cv_limit ? data.cv_limit : 0,
                        plan_type: data.plan_type,
                        job_boosting_days: data.job_boosting_days ? data.job_boosting_days : 0,
                        status: ExistingPlanDetail ? Constants.INACTIVE : Constants.ACTIVE,
                        free_plan_id: null,
                    };

                    await SubscribedUser.create(freePlanData).then(async result => {

                        if (!result) {
                            return Response.errorResponseData(
                                res,
                                res.__("Something went wrong")
                            );
                        }

                        freePlanId = await result.id;
                    })


                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Connected Plan details not found ,Hence you are not allowed to subscribe this plan"),
                        FAIL
                    );
                }
            }).catch(err => {
                console.log(" :: error :: ", err);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            })

        }

        const subUserObj = {
            user_id: authUserId,
            plan_id: body.plan_id,
            start_date: UserExistingPlans ? null : start_dates,
            expiry_date: UserExistingPlans ? null : expiry_dates,
            job_limit: subscriptionDetails.job_limit ? subscriptionDetails.job_limit : 0,
            email_limit: subscriptionDetails.email_limit ? subscriptionDetails.email_limit : 0,
            cv_limit: subscriptionDetails.cv_limit ? subscriptionDetails.cv_limit : 0,
            plan_type: subscriptionDetails.plan_type,
            job_boosting_days: subscriptionDetails.job_boosting_days ? subscriptionDetails.job_boosting_days : 0,
            status: UserExistingPlans ? Constants.INACTIVE : Constants.ACTIVE,
            free_plan_id: freePlanId ? freePlanId : null
        };

        await SubscribedUser.create(subUserObj)
            .then(async result => {
                if (result) {

                    if (req.body.type != 'W') {
                        TraData.subscribed_user_id = await result.id
                        TraData.save()
                    }
                    if (debitSubscription) {
                        debitSubscription.subscribed_user_id = await result.id;
                        await debitSubscription.save();
                    }

                    // if (cashBackWalletTransaction) {
                    //     cashBackWalletTransaction.subscribed_user_id = await result.id;
                    //     await cashBackWalletTransaction.save();
                    // }

                    // commision to the user who referrred 
                    let commissionReferDetails = await UserReferral.findOne({
                        where: {
                            user_id: authUserId
                        },
                        include: [{
                            model: User,
                            as: "registered_by",
                            required: true,
                            // where: {
                            //     user_role_type: {
                            //         [Op.in]: [Constants.USER_ROLE_TYPE.business_correspondence, Constants.USER_ROLE_TYPE.cluster_manager, Constants.USER_ROLE_TYPE.advisor]
                            //     }
                            // }
                        }]
                    })


                    // commission calculator =>
                    if (commissionReferDetails.registered_by.user_role_type === Constants.USER_ROLE_TYPE.business_correspondence || commissionReferDetails.registered_by.user_role_type === Constants.USER_ROLE_TYPE.cluster_manager || commissionReferDetails.registered_by.user_role_type === Constants.USER_ROLE_TYPE.advisor) {

                        let commissionAmount = await Helper.calculateCommissionBc(body.total_amount);
                        // creation of wallet transaction
                        walletTransactionObj["user_id"] = commissionReferDetails.ref_user_id
                        walletTransactionObj["previous_amount"] = commissionReferDetails.registered_by.wallet_money
                        walletTransactionObj["amount"] = commissionAmount
                        walletTransactionObj["total_amount"] = (+commissionReferDetails.registered_by.wallet_money + (+commissionAmount))
                        walletTransactionObj["type"] = Constants.WALLET_TYPE.credit
                        walletTransactionObj["reason"] = "Commission"
                        walletTransactionObj["details"] = `${UserData.name} has subscribed to ${subscriptionDetails.title}`
                        walletTransactionObj["subscribed_user_id"] = result.id;
                        await WalletTransactions.create(walletTransactionObj);
                        await User.update({
                            wallet_money: (+commissionReferDetails.registered_by.wallet_money + (+commissionAmount))
                        }, {
                            where: {
                                id: commissionReferDetails.ref_user_id,
                                status: {
                                    [Op.not]: DELETE,
                                },
                            },
                        })
                        let subsCommisionDetails = await UserReferral.findOne({
                            where: {
                                user_id: commissionReferDetails.ref_user_id
                            },
                            include: [{
                                model: User,
                                as: "registered_by",
                                required: true,
                                where: {
                                    user_role_type: {
                                        [Op.in]: [Constants.USER_ROLE_TYPE.business_correspondence, Constants.USER_ROLE_TYPE.cluster_manager, Constants.USER_ROLE_TYPE.advisor]
                                    }
                                }
                            }]
                        })


                        if (subsCommisionDetails) {
                            // creation of wallet transaction
                            let subCommissionAmount = await Helper.calculateCommissionSubBc(commissionAmount);
                            walletTransactionObj["user_id"] = subsCommisionDetails.ref_user_id;
                            walletTransactionObj["previous_amount"] = subsCommisionDetails.registered_by.wallet_money;
                            walletTransactionObj["amount"] = subCommissionAmount;
                            walletTransactionObj["total_amount"] = (+subsCommisionDetails.registered_by.wallet_money + (+subCommissionAmount));
                            walletTransactionObj["type"] = Constants.WALLET_TYPE.credit;
                            walletTransactionObj["reason"] = "Commission";
                            walletTransactionObj["details"] = `Your SUB_BC User ${commissionReferDetails.registered_by.name}'s candidate subscribed to ${subscriptionDetails.title}`;
                            walletTransactionObj["subscribed_user_id"] = result.id;
                            console.log(walletTransactionObj);
                            await WalletTransactions.create(walletTransactionObj)
                            await User.update({
                                wallet_money: (+subsCommisionDetails.registered_by.wallet_money + (+subCommissionAmount))
                            }, {
                                where: {
                                    id: subsCommisionDetails.ref_user_id,
                                    status: {
                                        [Op.not]: DELETE,
                                    },
                                },
                            })
                        }
                    }

                    // cashback and refer amount earned
                    if (commissionReferDetails.registered_by.user_role_type != Constants.USER_ROLE_TYPE.business_correspondence && commissionReferDetails.registered_by.user_role_type != Constants.USER_ROLE_TYPE.cluster_manager && commissionReferDetails.registered_by.user_role_type != Constants.USER_ROLE_TYPE.advisor && commissionReferDetails.registered_by.user_role_type != Constants.USER_ROLE_TYPE.field_sales_executive) {
                        let alreadyGivenRefer = await WalletTransactions.findOne({
                            where: {
                                user_id: commissionReferDetails.ref_user_id,
                                reason: "Referral_Amount_Earned",
                            },
                            include: [{
                                model: SubscribedUser,
                                required: true,
                                where: {
                                    user_id: authUserId
                                }
                            }]
                        })

                        // refer earned amount
                        if (!alreadyGivenRefer && subscriptionDetails.ref_amount_earned > 0) {
                            // subscriptionDetails
                            // wallet transaction for  ref_amount_earned (referred user)
                            walletTransactionObj["user_id"] = commissionReferDetails.ref_user_id
                            walletTransactionObj["previous_amount"] = commissionReferDetails.registered_by.wallet_money
                            walletTransactionObj["amount"] = subscriptionDetails.ref_amount_earned
                            walletTransactionObj["total_amount"] = (+commissionReferDetails.registered_by.wallet_money + (+subscriptionDetails.ref_amount_earned))
                            walletTransactionObj["type"] = Constants.WALLET_TYPE.credit
                            walletTransactionObj["reason"] = "Referral_Amount_Earned"
                            walletTransactionObj["details"] = `${UserData.name} has subscribed to ${subscriptionDetails.title}`
                            walletTransactionObj["subscribed_user_id"] = result.id;
                            await WalletTransactions.create(walletTransactionObj);
                            await User.update({
                                wallet_money: (+commissionReferDetails.registered_by.wallet_money + (+subscriptionDetails.ref_amount_earned))
                            }, {
                                where: {
                                    id: commissionReferDetails.ref_user_id,
                                    status: {
                                        [Op.not]: DELETE,
                                    },
                                },
                            })
                        }

                    }

                    return Response.successResponseData(
                        res,
                        response,
                        res.locals.__("Payment is successful")
                    );
                }
            })
            .catch(e => {
                console.log(":e :", e);
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                );
            });
    },


    /** 
     * @description My Profile
     * @param req
     * @param res
     */
    SubscribedUserDetail: async(req, res) => {

        const { authUserId } = req;

        let userData = await User.findByPk(authUserId);
        const user_role_type = userData.user_role_type;

        console.log(" ::: user_role_type ::: ", user_role_type);

        if (userData.user_role_type === "CS") {
            await SubscribedUser.findAndCountAll({
                    include: [{
                        model: SubscriptionPlan,
                        user_role_type: user_role_type
                    }, ],
                    where: {
                        user_id: userData.company_id,
                        status: {
                            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE]
                        },
                    },
                })
                .then(async userData => {
                    if (userData) {
                        const responseData = userData;
                        return Response.successResponseData(
                            res,
                            responseData,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not available")
                        );
                    }
                })
                .catch(e => {
                    console.log(e);
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                });
        } else {
            await SubscribedUser.findAndCountAll({
                    attributes: {
                        include: [
                            [
                                Sequelize.literal(`(
								SELECT SubscribedUser.job_limit - COUNT(*) 
								FROM job_post AS Job
								Where
								Job.subscription_plan_id = SubscribedUser.id
								AND
								SubscribedUser.job_limit != 0
								AND
								Job.user_id = ${authUserId}
							)`),
                                'AvailableJobLimits'
                            ],
                            [
                                Sequelize.literal(`(
								SELECT SubscribedUser.email_limit - COUNT(*) 
								FROM resume_access_data AS accessData
								Where
								accessData.email_downloaded = 'Y'
								AND	
								accessData.user_id = ${authUserId}
								AND
								SubscribedUser.email_limit != 0
								AND
								accessData.user_subscribed_id = SubscribedUser.id
							)`),
                                'AvailableEmailLimits'
                            ],
                            [
                                Sequelize.literal(`(
								SELECT SubscribedUser.cv_limit - COUNT(*) 
								FROM resume_access_data AS accessData
								Where
								accessData.cv_downloaded = 'Y'
								AND	
								accessData.user_id = ${authUserId}
								AND
								SubscribedUser.cv_limit != 0
								AND
								accessData.user_subscribed_id = SubscribedUser.id
							)`),
                                'AvailableCvlLimits'
                            ],
                        ],
                    },
                    include: [{
                        model: SubscriptionPlan,
                        where: {
                            user_role_type: user_role_type,
                        },
                    }, ],

                    where: {
                        user_id: authUserId,
                        status: {
                            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE]
                        },
                    },
                })
                .then(async userData => {
                    if (userData) {
                        console.log("::userData :: ", userData);
                        const responseData = userData;
                        return Response.successResponseData(
                            res,
                            responseData,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not available")
                        );
                    }
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

    TransactionHistories: async(req, res) => {
        const { authUserId } = req;
        const {
            page,
            sortBy,
            month,
            year,
            payment_type,
            payment_status,
            status,
        } = req.query;

        let limit = 0;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ["id", sortBy != null ? sortBy : "DESC"]
        ];

        const options = {
            where: {
                user_id: authUserId,
            },
            offset: offset,
            order: sorting,
        };

        if (limit) options["limit"] = limit;

        if (month)
            options["where"]["$and"] = Sequelize.where(
                Sequelize.fn("month", Sequelize.col("createdAt")),
                month
            );
        if (year)
            options["where"]["$and"] = Sequelize.where(
                Sequelize.fn("year", Sequelize.col("createdAt")),
                year
            );
        if (payment_type) options["where"]["payment_type"] = payment_type;
        if (payment_status) options["where"]["payment_status"] = payment_status;
        if (status) options["where"]["status"] = status;

        let transactionData = await TransactionHistory.findAndCountAll(options);

        if (!transactionData) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("Something went wrong")
            );
        }

        if (transactionData.rows.length > 0) {
            const extra = [];
            extra.per_page = limit;
            extra.total = transactionData.count;
            extra.page = pageNo;
            return Response.successResponseData(
                res,
                transactionData,
                Constants.SUCCESS,
                res.locals.__("Success"),
                extra
            );
        } else {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No data found"),
                Constants.FAIL
            );
        }
    },

    /**
     * @description Used to activate S	ubscribed-Inactive Plans
     * @param req
     * @param res
     */
    activatePlan: async(req, res) => {
        const { authUserId } = req;
        const reqParam = req.body;

        let planObj = {
            subscription_id: Joi.number().required(),
        };

        const schema = Joi.object(planObj);
        const { error } = schema.validate(reqParam);

        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey("Plan Activation validation", error))
            );
        }

        let planDetails = await SubscribedUser.findOne({
            where: {
                user_id: authUserId,
                id: reqParam.subscription_id,
                status: INACTIVE,
                start_date: null,
                expiry_date: null,
            },
        });

        if (!planDetails) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__("No subscribed/inactive plan found"),
                Constants.FAIL
            );
        } else {

            // extra benefit if we delete all active plans of same type
            let oldSubscriptions = await SubscribedUser.update({ status: DELETE }, {
                where: {
                    user_id: authUserId,
                    status: ACTIVE,
                    plan_type: planDetails.plan_type,
                },
            })

            const PlanData = await SubscriptionPlan.findByPk(planDetails.plan_id);

            planDetails.status = ACTIVE;
            planDetails.start_date = moment();
            planDetails.expiry_date = moment().add(PlanData.expiry_days, "d");

            await planDetails
                .save()
                .then(async data => {
                    if (oldSubscriptions) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__(
                                "Previously Active plans Deactivated and this plan activated Successfully "
                            )
                        );
                    }
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__("Plan activated Successfully ")
                    );
                });
        }

    },

    getAllSubscriptionsPlans: async(req, res) => {

        const { authUserId } = req;
        let userData = await User.findByPk(authUserId);
        const user_role_type = userData.user_role_type;

        console.log("UserIdUserId ::: , ", authUserId, "  :::: ", userData);

        if (userData.user_role_type === "CS") {
            await SubscribedUser.findOne({
                    include: [{
                        model: SubscriptionPlan,
                        user_role_type: user_role_type
                    }, ],
                    where: {
                        user_id: userData.company_id,
                        status: Constants.ACTIVE,
                    },
                })
                .then(async userData => {
                    if (userData) {
                        const responseData = userData;
                        return Response.successResponseData(
                            res,
                            responseData,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not available")
                        );
                    }
                })
                .catch(e => {
                    console.log(e);
                    return Response.errorResponseData(
                        res,
                        res.__("Something went wrong")
                    );
                });
        } else {
            await SubscribedUser.findOne({
                    include: [{
                        model: SubscriptionPlan,
                        where: {
                            user_role_type: user_role_type,
                        },
                    }, ],
                    where: {
                        user_id: authUserId,
                        status: Constants.ACTIVE,
                    },
                })
                .then(async userData => {
                    if (userData) {
                        const responseData = userData;
                        return Response.successResponseData(
                            res,
                            responseData,
                            res.locals.__("Success")
                        );
                    } else {
                        return Response.successResponseWithoutData(
                            res,
                            res.locals.__("User not available")
                        );
                    }
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

    getAllTransactionHistory: async(req, res) => {
        const {
            transaction_history_id,
            payment_status,
            page,
            sortBy
        } = req.query;

        const { authUserId } = req;

        let limit = 0;
        if (page) limit = 26;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 26;

        const offset = (pageNo - 1) * limit;
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        let query = {
            user_id: authUserId,
        }

        let options = {
            where: query,
            order: sorting,
            offset: offset,
        }

        if (payment_status) query['payment_status'] = payment_status;
        if (limit) options['limit'] = limit;

        if (transaction_history_id && transaction_history_id != '') {
            query['id'] = transaction_history_id;
            await TransactionHistory.findOne(options)
                .then(async data => {
                    if (data) {
                        return Response.successResponseData(
                            res,
                            data,
                            SUCCESS,
                            res.locals.__("Success")
                        );
                    } else {
                        console.log(e);
                        Response.errorResponseData(
                            res,
                            res.__("Internal error"),
                            INTERNAL_SERVER
                        );
                    }
                })
                .catch((e) => {
                    console.log("error ::", e);
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__("No Transaction History found"),
                        FAIL
                    );

                })

        } else {
            await TransactionHistory
                .findAndCountAll(options)
                .then(
                    async data => {
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
                                res.locals.__("No Transaction History found"),
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

    }
};