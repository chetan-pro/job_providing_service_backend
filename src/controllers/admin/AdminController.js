const {
    Op
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    Industry
} = require("../../models");

module.exports = {
    dashboard: (req, res) => {
        res.render("admin/dashboard");
    },


    industry: async(req, res) => {
        const message = req.flash('success')

        let page = parseInt(req.query.page) || 1
        const { search } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            offset: offset,
        };
        if (limit) options['limit'] = limit;
        if (!search) {

            await Industry.findAndCountAll(options)
                .then((data) => {
                    if (!data.rows.length) {
                        res.render('admin/industries/industries')
                    } else {
                        const extra = {
                            per_page: limit,
                            total: data.count,
                            pages: Math.ceil(data.count / limit),
                            pageNo: pageNo
                        }
                        Industry.findAndCountAll()
                            .then((countdata) => {
                                res.render('admin/industries/industries', { data, extra, search, pageNo, limit, message })
                            })
                            .catch((err) => {
                                console.log(err)
                            })

                    }
                })
                .catch((e) => {
                    console.log(e)
                })
        } else {
            await Industry.findAndCountAll({
                    where: {
                        name: {
                            [Op.or]: [
                                {
                                    [Op.like]: '%' + search + '%' },
                            ]
                        }

                    },
                    limit
                })
                .then((data) => {
                    if (!data.rows) {
                        res.render('admin/industries/industries')
                    } else {
                        const extra = {
                            per_page: limit,
                            total: data.count,
                            pages: Math.ceil(data.count / limit),
                            pageNo: pageNo
                        }
                        res.render('admin/industries/industries', { data, extra, search, pageNo, limit, message })
                    }
                })
                .catch((e) => {
                    console.log(e)
                })
        }
    },


    industrycreate: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')

        res.render("admin/industries/industriescreate", {
            message,
            error
        });
    },

    addindustrycreate: async(req, res) => {
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().trim().required()
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            console.log('37', error)
        } else {

            Industry.findOrCreate({
                    where: {
                        name: data.name
                    },
                })
                .then((industrydata) => {
                    console.log(industrydata)
                    const boolean = industrydata[1];
                    if (boolean === true) {
                        req.flash('success', 'Industry name created sucessfully !');
                        res.redirect('/admin/industries/create')
                    } else {
                        req.flash('error', 'Industry Already Exists !');
                        res.redirect('/admin/industries/create')
                    }
                })
                .catch((err) => {
                    console.log(err)
                });

        }
    },

    industryupdateP: async(req, res) => {
        const id = req.params.id
        await Industry.findByPk(id)
            .then((alldata) => {
                res.render('admin/industries/industriesupdate', {
                    alldata
                })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    industryupdate: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required()
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            console.log('37', error)
        } else {
            await Industry.update(data, {
                    where: {
                        id: id
                    }
                })
                .then((industrydata) => {
                    req.flash('success', 'Industry Updated sucessfully !');
                    res.redirect('/admin/industries')
                })
        }

    },

    industrydelete: async(req, res) => {

        const id = req.params.id

        Industry.destroy({
                where: {
                    id: id
                }
            })
            .then((data) => res.redirect('/admin/industries'))
            .catch((err) => console.log(err))
    },
};