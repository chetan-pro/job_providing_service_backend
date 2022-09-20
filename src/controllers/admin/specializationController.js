const Joi = require("@hapi/joi");
const {
    Op
} = require("sequelize");
const bcrypt = require('bcrypt')
const Helper = require('../../services/Helper')
const jwToken = require('../../services/jwtToken')
const Mailer = require('../../services/Mailer')
const moment = require('moment')
const path = require("path");


var fs = require('fs');
var excel = require('excel4node');

const {
    USER_ROLE_TYPE,
    ACTIVE,
    DELETE,
    INACTIVE
} = require('../../services/Constants')
const {
    Course,
    Specialization
} = require("../../models");

module.exports = {

    showSpecialization : async(req, res) =>{
        const message = req.flash('success')
        const error = req.flash('error')

        let page = parseInt(req.query.page) || 1
        var {search, status} = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                status :{
                    [Op.not]: [INACTIVE, DELETE]
                }
            },
            order: sorting,
            offset: offset,
            limit: limit,
            include: [{
                model: Course,
                where: {
                    status :{
                        [Op.not]: [INACTIVE, DELETE]
                    }
                },
            }]
        };
        if (limit) options['limit'] = limit;
        let statusfilter = status ? status : ''
        let searchVal = search ? search : ''
        if(search){
            options['where']['name'] = {
                [Op.like] : `%${search}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        await Specialization.findAndCountAll(options)
            .then((data) => {

                // return res.send({data})

                if (data.count === 0) {                    
                    res.render('admin/Specialization/specialization.ejs', {error: 'No data found !', data, searchVal , statusfilter, pageNo, limit, extra: '', message: ''})
                } else {
                    const extra = {
                        per_page : limit,
                        total : data.count,
                        pages : Math.ceil(data.count / limit),
                        pageNo : pageNo
                    }
                    res.render('admin/Specialization/specialization.ejs', { data, extra, searchVal , pageNo, limit, statusfilter, message, error })   
                }
            } )
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    showAddSpecialization: async(req,res) =>{

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await Course.findAll({
            where: {
                [Op.not]: [
                    { status: INACTIVE},
                    { status: DELETE},
                ]
            },
        })
        .then(data => {
            res.render('admin/Specialization/addSpecialization.ejs', { data, message, error, formValue })
        })
        .catch((e) => {
            req.flash('error', 'please check your network connection !');
            res.redirect(req.header('Referer'))
        })


    },

    addSpecialization: async(req,res) =>{
        
        console.log(" : into the conroller :: ");

        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().required()
                    .messages({
                    'any.required': `"name" is a required field`
                }),
            course_id: Joi.string().required()
                .messages({
                    'string.empty': `"Course" cannot be an empty field`,
                    'any.required': `"Course" is a required field`
                }),
            status: Joi.number().required(),
        })
        const { error } = await schema.validate(reqParams)
        
        if (error) {
            // return res.send(error)
            req.flash('formValue',reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
 
            Specialization.findOrCreate({
                where: {
                    name: reqParams.name,
                    course_id: reqParams.course_id,
                    status: reqParams.status
                },
            })
            .then((sectordata) => {
                const boolean = sectordata[1];

                console.log(" :: sectordata ", sectordata);

                if (boolean === true) {
                    req.flash('formValue',reqParams);
                    req.flash('success', 'Specialization created sucessfully !');
                    res.redirect('/admin/show-specialization')
                } else {
                    req.flash('formValue',reqParams);
                    req.flash('error', 'Specialization Already Exists !');
                    res.redirect(req.header('Referer'))
                }
            })
            .catch((err) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            });
    
        }
    },
    
    showSpecializationUpdate: async (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const CourseData = await Course.findAll({
            where: {
                [Op.not]: [
                    { status: INACTIVE},
                    { status: DELETE},
                ]
            },
        })
        const id = req.params.id
        await Specialization.findByPk(id, {
            include: [
                { 
                    model: Course,
                }, 
                
            ], })
            .then((alldata) => {
                res.render('admin/Specialization/editSpecialization.ejs', { alldata, error, message, CourseData, id })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    SpecializationUpdate: async (req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            course_id: Joi.string().required()
                        .messages({
                            'string.empty': `"Course" cannot be an empty field`,
                            'any.required': `"Course" is a required field`
                        }),
            status: Joi.string().required(),
        })
        const { error } = await schema.validate(data)
        if (error) {
            req.flash('formValue',data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await Specialization.update(data, {
                    where: {
                        id: id
                    }
            })
            .then(() => {
                req.flash('success', 'Specialization Updated sucessfully !');
                res.redirect('/admin/show-specialization')
            })
            .catch((error) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
        }

    },

    specializationDelete: async (req, res) => {

        console.log(" :: into the controller :: ");

        const id = req.params.id
        let data = { status: 2 }
        Specialization.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Specialization Deleted sucessfully !');
                res.redirect('/admin/show-specialization')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/show-specialization')
            })
    },
}