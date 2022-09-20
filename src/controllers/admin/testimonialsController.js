const {
    Op,
    where,
    Sequelize
} = require("sequelize");
const Joi = require("@hapi/joi");
const { Testimonials, state, city } = require("../../models");
const path = require("path");
const {} = require('../../services/Constants');
const moment = require("moment");
const Helper = require('../../services/Helper')

module.exports = {
    getTestimonials: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')

        let page = parseInt(req.query.page) || 1
        var {
            search,
            filter,
            sort
        } = req.query
        let limit = null;
        var sorting = [
            ['id', 'DESC']
        ]
        if (page) limit = 5;
        if (sort) {
            sorting = [
                ['id', sort]
            ]
        }
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {},
            order: sorting,
            offset: offset,
            limit: limit,
            include: [
                { model: state },
                { model: city },
            ]
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        let filterVal = filter ? filter : '';
        let sortVal = sort ? sort : '';

        filterVal = 1




        await Testimonials.findAndCountAll(options)
            .then((data) => {
                console.log(data);
                if (data.count === 0) {
                    res.render('admin/testimonials/getTestimonials', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        filterVal,
                        sortVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: ''
                    });
                } else {
                    res.render('admin/testimonials/getTestimonials', {
                        error: '',
                        data,
                        searchVal,
                        filterVal,
                        sortVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: ''
                    });
                }
            })
            .catch((e) => {
                console.log(":::::::::::::::chetn::::::::::::::::::::");
                console.log(e);
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },
    addTestimonials: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
            // let data = [];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render('admin/testimonials/addTestimonials', {
                    message: '',
                    error: '',
                    statedata
                });
                return;
            });
    },

    createTestimonial: async(req, res) => {
        console.log("i am hitted");
        const fields = req.files;
        const reqParam = req.fields;
        let images;
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            message: Joi.string().required()
                .messages({
                    'string.empty': `"Message" cannot be an empty field`,
                    'any.required': `"Message" is a required field`
                }),
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
            state_id: Joi.string().required()
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().required()
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)
        console.log("::::::::::::::::::::error:::::::::::::::::::::");
        console.log(error);
        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            console.log("fields.image.type");
            console.log(fields.image.type);
            try {
                let imageName;
                images = true;
                const extension = fields.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.image && (!imageExtArr.includes(extension))) {
                    // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    res.redirect(req.header('Referer'))
                }
                imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                await Helper.ImageUpload(req, res, imageName)

                // return;
                const testimonialObj = {
                    name: reqParam.name,
                    message: reqParam.message,
                    state_id: reqParam.state_id,
                    city_id: reqParam.city_id,
                    image: imageName,
                }
                await Testimonials.create(testimonialObj)
                    .then(async(result) => {
                        req.flash('formValue', reqParam);
                        req.flash('success', 'Testimonial Added Successfully');
                        res.redirect('/admin/get-testimonials')
                    }).catch((e) => {
                        req.flash('formValue', reqParam);
                        req.flash('error', `${e}`);
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('385', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    testimonialsDetails: async(req, res) => {
        const id = req.params.id

        await Testimonials.findByPk(id, {
                include: [

                    { model: state },
                    { model: city },

                ],
                attributes: {
                    include: [
                        [Sequelize.fn("concat", "http://localhost:3002/assets/images/user/", Sequelize.col("Testimonials.image")), 'image']
                    ],
                }
            })
            .then((alldata) => {
                console.log("sdvmslvksskvsvsv");
                console.log(alldata);
                res.render('admin/testimonials/testimonialsDetail.ejs', { alldata, id })
            })
            .catch((err) => {
                console.log(err)
            })
    },
    editTestimonials: async(req, res) => {
        const id = req.params.id;
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await Testimonials.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                ]
            })
            .then((alldata) => {
                state
                    .findAll({
                        include: [{
                            model: city,
                        }, ],
                    })
                    .then((statedata) => {
                        // return res.send(alldata)
                        res.render("admin/testimonials/editTestimonials", {
                            message,
                            error,
                            statedata,
                            alldata,
                            formValue,
                        });
                    });
            })
            .catch((err) => {
                req.flash('formValue', reqParam);
                req.flash('error', `Please check your network connection or ${err.details[0].message}`, );
                res.redirect(req.header('Referer'))
            });

    },

    updateTestimonials: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const alldata = req.flash('alldata')[0];
        const id = req.params.id;
        const reqParam = req.body;

        const schema = Joi.object({
            name: Joi.string().trim().max(50).required(),
            message: Joi.string().required()
                .messages({
                    'string.empty': `"Message" cannot be an empty field`,
                    'any.required': `"Message" is a required field`
                }),
            state_id: Joi.string().required()
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().required()
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
        });
        const { err } = await schema.validate(reqParam);
        if (err) {
            req.flash('alldata', reqParam);
            req.flash('error', 'please fill the field : ', err.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await Testimonials.update(reqParam, {
                    where: {
                        id: id,
                    },
                }).then((reqParam) => {
                    req.flash('alldata', reqParam);
                    req.flash("success", "Testimonial Updated sucessfully !");
                    res.redirect(req.header('Referer'))
                })
                .catch((err) => {
                    req.flash('alldata', reqParam);
                    req.flash("error", err);
                    res.redirect(req.header('Referer'))
                })
        }
    },

    deleteTestimonials: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id
        Testimonials.destroy({
                where: {
                    id: id
                }
            })
            .then(async(data) => {
                req.flash("error", "Service Seeker Deleted sucessfully !");
                res.redirect(req.header('Referer'))
            })
            .catch((err) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })
    },
}