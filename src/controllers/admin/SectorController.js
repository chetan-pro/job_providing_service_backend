const { Op } = require('sequelize')
const Joi = require('@hapi/joi')

const { Industry, Sector } = require('../../models')
const { INACTIVE, DELETE, ACTIVE } = require('../../services/Constants')

module.exports = {

    sector: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')

        let page = parseInt(req.query.page) || 1
        var { search, status } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                status: [ACTIVE, INACTIVE]
            },
            order: sorting,
            offset: offset,
            limit: limit,
            include: [{
                model: Industry,
                where: {
                    [Op.not]: [
                        { status: INACTIVE },
                        { status: DELETE },
                    ]
                },
            }]
        };
        if (limit) options['limit'] = limit;
        let statusfilter = status ? status : ''
        let searchVal = search ? search : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            console.log(":::::::::::::::status:::::::::::::::::::::");
            console.log(status);
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        await Sector.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/sector/sector', { error: 'No data found !', data, searchVal, statusfilter, pageNo, limit, extra: '', message: '' })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/sector/sector', { data, extra, searchVal, pageNo, limit, statusfilter, message, error })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    sectorcreate: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await Industry.findAll({
                where: {
                    status: [ACTIVE]
                },
            })
            .then(data => {
                res.render('admin/sector/sector-create', { data, message, error, formValue })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    addsectorcreate: async(req, res) => {
        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().required()
                .messages({
                    'any.required': `"name" is a required field`
                }),
            industry_id: Joi.string().required()
                .messages({
                    'string.empty': `"industry" cannot be an empty field`,
                    'any.required': `"industry" is a required field`
                }),
            status: Joi.number().required(),
        })
        const { error } = await schema.validate(reqParams)

        if (error) {
            // return res.send(error)
            req.flash('formValue', reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            Sector.findOrCreate({
                    where: {
                        name: reqParams.name,
                        industry_id: reqParams.industry_id,
                        status: reqParams.status
                    },
                })
                .then((sectordata) => {
                    const boolean = sectordata[1];
                    if (boolean === true) {
                        req.flash('formValue', reqParams);
                        req.flash('success', 'Sector name created sucessfully !');
                        res.redirect('/admin/sector')
                    } else {
                        req.flash('formValue', reqParams);
                        req.flash('error', 'Sector Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });

        }
    },

    sectorupdateP: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const Industrydata = await Industry.findAll({
            where: {
                [Op.not]: [
                    { status: INACTIVE },
                    { status: DELETE },
                ]
            },
        })
        const id = req.params.id
        await Sector.findByPk(id, {
                include: [{
                        model: Industry,
                    },

                ],
            })
            .then((alldata) => {
                res.render('admin/sector/sector-edit', { alldata, error, message, Industrydata, id })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    sectorupdate: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            industry_id: Joi.string().required()
                .messages({
                    'string.empty': `"industry" cannot be an empty field`,
                    'any.required': `"industry" is a required field`
                }),
            status: Joi.string().required(),
        })
        const { error } = await schema.validate(data)
        if (error) {
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await Sector.update(data, {
                    where: {
                        id: id
                    }
                })
                .then(() => {
                    req.flash('success', 'sector Updated sucessfully !');
                    res.redirect('/admin/sector')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    sectordelete: async(req, res) => {

        const id = req.params.id

        let data = { status: 2 }
        Sector.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'sector Deleted sucessfully !');
                res.redirect('/admin/sector')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/sector')
            })
    },

    sectordelete: async(req, res) => {

        const id = req.params.id

        let data = { status: 2 }
        Sector.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'sector Deleted sucessfully !');
                res.redirect('/admin/sector')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/sector')
            })
    },

}