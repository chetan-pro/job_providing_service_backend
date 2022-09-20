const {
    Op
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    EducationData
} = require("../../models");
const { INACTIVE, DELETE, ACTIVE } = require("../../services/Constants");

module.exports = {

    education_data: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')

        let page = parseInt(req.query.page) || 1
        var { search, status } = req.query
        let limit = null;
        if (page) limit = 10;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                status: [INACTIVE, ACTIVE],

            },
            order: sorting,
            offset: offset,
            limit: limit,
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''
        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        await EducationData.findAndCountAll(options)
            .then((data) => {
                if (data.count === 0) {
                    res.render('admin/education_data/education_data', { error: 'No data found !', data, statusfilter, searchVal, pageNo, limit, extra: '', message: '' })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo,
                    }
                    res.render('admin/education_data/education_data', { data, extra, searchVal, statusfilter, pageNo, limit, message, error })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    education_datacreate: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/education_data/education_datacreate", { formValue, message, error });
    },

    addeducation_datacreate: async(req, res) => {
        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().trim().required().alphanum(),
            status: Joi.string().trim().required(),
        })
        const { error } = await schema.validate(reqParams)

        if (error) {
            req.flash('formValue', reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            EducationData.findOrCreate({
                    where: {
                        name: reqParams.name,
                        status: reqParams.status
                    },
                })
                .then((EducationDatadata) => {
                    const boolean = EducationDatadata[1];
                    if (boolean) {
                        req.flash('formValue', reqParams);
                        req.flash('success', 'Education Data created sucessfully !');
                        res.redirect('/admin/education_data')
                    } else {
                        req.flash('formValue', reqParams);
                        req.flash('error', 'Education Data Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });

        }
    },

    education_dataupdateP: async(req, res) => {
        const formValue = req.flash('formValue')[0];
        const error = req.flash('error')
        const message = req.flash('success')

        const id = req.params.id
        await EducationData.findByPk(id)
            .then((alldata) => {
                res.render('admin/education_data/education_dataupdate', { alldata, formValue, error, message })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    education_dataupdate: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            status: Joi.string().required(),
        })
        const { error } = await schema.validate(data)
        if (error) {
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await EducationData.update(data, {
                    where: {
                        id: id
                    }
                })
                .then(() => {
                    req.flash('success', 'Education Data Updated sucessfully !');
                    res.redirect('/admin/education_data')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect('/admin/education_data')
                })
        }

    },

    education_datadelete: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }
        EducationData.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Education Data Deleted sucessfully !');
                res.redirect('/admin/education_data')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/education_data')
            })
    },
};