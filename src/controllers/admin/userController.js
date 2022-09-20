const {
    Op,
    sequelize
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    User,
    Role,
    Sequelize,
    UserRoles
} = require("../../models");



module.exports = {

    user: async(req, res) => {

        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            offset: offset,
        };
        if (limit) options['limit'] = limit;
        console.log('29', options)
        const roletype = 'COMPANY'
        User.findAndCountAll({
                attributes: ["id", "name"],
                include: [{
                    model: UserRoles,
                    where: {
                        'roleType': roletype
                    },
                }],
                options,
            })
            .then((data) => {
                // return res.send(data)
                if (data.count === 1) {
                    res.render('admin/user/user', { message: 'No Data Found !' })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/user/user', {
                        data,
                        message: '',
                        extra,
                        pageNo,
                        limit,
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })



    }

};