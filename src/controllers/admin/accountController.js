const {
    Op,
    Sequelize
} = require("sequelize");

const Joi = require('@hapi/joi')
const { User, UserRoles, state, city } = require("../../models");
const {
    USER_ROLE_TYPE, ACTIVE, INACTIVE
} = require('../../services/Constants')


module.exports = {

    activeaccount: async (req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            user_role_type
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                status: ACTIVE,
                
            },  
            offset: offset,
            limit: limit,
            include: [{
                model: UserRoles,
                where: {
                    [Op.or]: [
                        {roleType: USER_ROLE_TYPE.home_service_seeker},
                        {roleType: USER_ROLE_TYPE.home_service_provider},
                        {roleType: USER_ROLE_TYPE.local_hunar}
                    ]
                }
            }],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let rolefilter = user_role_type ? user_role_type : ''

        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (user_role_type) {
            options['where']['user_role_type'] = {
                [Op.like]: `%${user_role_type}%`
            }
        }

        await User.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/Accounts/active', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        rolefilter
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/Accounts/active', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        rolefilter
                    })
                }
            })
            .catch((e) => {
                console.log('114', e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    activeInactiveaccount: async (req, res) => {

        const id = req.params.id

        let userDetails = await User.findByPk(id);

        let data ;
        userDetails.status === ACTIVE ?  data = { status: INACTIVE } : data = { status: ACTIVE };
        let msg;
        userDetails.status === ACTIVE ?  msg = 'Deactivated' : msg = 'Activated';
        
        User.update(data, {
            where: {
                id: id
            }
        })
            .then((data) => {
                req.flash('success', `Account ${msg} sucessfully !`);
                return res.redirect('/admin/account/active')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    inactiveaccount: async (req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search,
            user_role_type
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                status: INACTIVE,
                
            },  
            offset: offset,
            limit: limit,
            include: [{
                model: UserRoles,
                where: {
                    [Op.or]: [
                        {roleType: USER_ROLE_TYPE.home_service_seeker},
                        {roleType: USER_ROLE_TYPE.home_service_provider},
                        {roleType: USER_ROLE_TYPE.local_hunar}
                    ]
                }
            }],
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let rolefilter = user_role_type ? user_role_type : ''

        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (user_role_type) {
            options['where']['user_role_type'] = {
                [Op.like]: `%${user_role_type}%`
            }
        }

        await User.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/Accounts/inactive', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        rolefilter
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/Accounts/inactive', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        rolefilter
                    })
                }
            })
            .catch((e) => {
                console.log('114', e)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    inactiveActiveaccount: async (req, res) => {

        const id = req.params.id
        let data = { status: ACTIVE }
        User.update(data, {
            where: {
                id: id
            }
        })
            .then((data) => {
                req.flash('success', 'Account Inactive sucessfully !');
                return res.redirect('/admin/account/inactive')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

    getUser: async (req, res) => {
        const id = req.params.id

        await User.findByPk(id, {
                include: [{
                        model: state
                    },
                    {
                        model: city
                    }
                ],
            })
            .then((alldata) => {
                if(alldata.state_id === 0) {
                    let state = 'Nil'
                    let city = 'Nil'
                    res.render('admin/Accounts/userDetail', {
                        alldata, city, state
                    })
                } else {
                    let state = alldata.state.name
                    let city = alldata.city.name
                    res.render('admin/Accounts/userDetail', {
                        alldata, city, state
                    })
                }
            })
            .catch((err) => {
                console.log(err)
                req.flash('error', 'please check your network connection !');
                return res.redirect(req.header('Referer'))
            })
    },

}