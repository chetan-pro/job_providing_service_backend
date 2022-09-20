const { WalletTransactions, User, WalletSettlements } = require("../../models");
const {
    Op
} = require("sequelize");
const {
    USER_ROLE_TYPE
} = require('../../services/Constants');
const moment = require('moment');
const path = require("path");
const Helper = require('../../services/Helper')



module.exports = {

    wallet: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        console.log(req.query)
        let page = parseInt(req.query.page) || 1
        var {
            search,
            type
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {},
            offset: offset,
            limit: limit,
            include: [{
                model: User,
            }],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''


        await WalletTransactions.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/wallet/wallet', {
                        error: 'No data found !',
                        type,
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: ''
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/wallet/wallet', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        type
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    // Candidate and HSP pending payment requests

    pendingPayments: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                status: "p"
            },
            offset: offset,
            limit: limit,
            include: {
                model: User,
                where: {
                    // user_role_type: [
                    //     USER_ROLE_TYPE.candidate,
                    //     USER_ROLE_TYPE.home_service_provider
                    // ]
                }
            }

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        if (search) {
            options['include'] = {
                model: User,
                where: {
                    [Op.and]: [{
                            [Op.or]: [
                                { user_role_type: USER_ROLE_TYPE.candidate },
                                { user_role_type: USER_ROLE_TYPE.home_service_provider }
                            ]
                        },
                        {
                            name: {
                                [Op.like]: `%${search}%`
                            },
                        }
                    ]
                }
            }

        }
        await WalletSettlements.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/wallet/settlementList', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        pageName: "PendingList"
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/wallet/settlementList', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        pageName: "PendingList"
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    acceptPendingPayments: async(req, res) => {
        if (!req.files.transactionFile.size > 0) {
            req.flash('formValue');
            req.flash('error', 'Transaction image is required');
            return res.redirect(req.header('Referer'))
        }
        const extension = req.files.transactionFile.type;
        const imageExtArr = [
            "image/jpg",
            "application/octet-stream",
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];

        if (req.files && req.files.transactionFile && !imageExtArr.includes(extension)) {
            req.flash('formValue', reqParam);
            req.flash('error', 'Image invalid');
            return res.redirect(req.header('Referer'))
        }
        let fileName = req.files.transactionFile ? `${req.files.transactionFile.name.split(".")[0]}${moment().unix()}${path.extname(req.files.transactionFile.name)}` : "";
        await Helper.FileUploader(req.files.transactionFile, res, fileName)
        WalletSettlements.update({ status: "a", file: fileName }, {
                where: {
                    id: req.params.id
                }
            })
            .then((data) => {
                res.redirect(req.header('Referer'))
            })

    },

    rejectPendingPayments: async(req, res) => {

        const id = req.params.id;
        const message = req.flash('success')
        const error = req.flash('error')

        WalletSettlements.update({ status: "r" }, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                res.redirect(req.header('Referer'))
            })

    },

    activePayments: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                [Op.or]: [
                    { status: "a" },
                    { status: "r" },
                ]
            },
            offset: offset,
            limit: limit,
            include: {
                model: User,
                where: {
                    [Op.or]: [
                        { user_role_type: USER_ROLE_TYPE.candidate },
                        { user_role_type: USER_ROLE_TYPE.home_service_provider }
                    ]
                }
            }

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        if (search) {
            options['include'] = {
                model: User,
                where: {
                    [Op.and]: [{
                            [Op.or]: [
                                { user_role_type: USER_ROLE_TYPE.candidate },
                                { user_role_type: USER_ROLE_TYPE.home_service_provider }
                            ]
                        },
                        {
                            name: {
                                [Op.like]: `%${search}%`
                            },
                        }
                    ]
                }
            }

        }
        await WalletSettlements.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/wallet/settlementList', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        pageName: "ActiveList"
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/wallet/settlementList', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        pageName: "ActiveList"
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    allTransactions: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        const id = req.params.id
        const roleType = req.query.user
        let page = parseInt(req.query.page) || 1
        let limit = null;

        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                user_id: id
            },
            offset: offset,
            limit: limit,

        };
        if (limit) options['limit'] = limit;
        await WalletTransactions.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/wallet/allTransactions', {
                        error: 'No data found !',
                        data,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        id,
                        roleType
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/wallet/allTransactions', {
                        data,
                        extra,
                        pageNo,
                        limit,
                        message,
                        error,
                        id,
                        roleType
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

}