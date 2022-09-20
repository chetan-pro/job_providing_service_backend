const {
    Op
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    SkillSubCategory,
    SkillCategory
} = require("../../models");
const { DELETE, INACTIVE, ACTIVE } = require("../../services/Constants");

module.exports = {

    Skill_Sub_Category: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')

        let page = parseInt(req.query.page) || 1
        var {
            search,
            status,
            skill_category_id
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let sorting = [
            ['id', 'DESC']
        ]
        const options = {
            where: {
                [Op.not]: [
                    { status: DELETE },
                ]
            },
            order: sorting,
            offset: offset,
            limit: limit,
            include: [{
                model: SkillCategory,
                where: {
                    [Op.not]: [
                        { status: DELETE },
                        { status: INACTIVE },
                    ]
                },
            }]
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''

        if (search) {
            options['where']['name'] = {
                [Op.like]: `%${search}%`
            }
        }
        if (skill_category_id) {
            options['where']['skill_category_id'] = {
                [Op.like]: `%${skill_category_id}%`
            }
        }
        if (status) {
            options['where']['status'] = {
                [Op.like]: `%${status}%`
            }
        }

        const skillfilter = await SkillCategory.findByPk(skill_category_id)
        let skillFilterVal = skillfilter ? skillfilter.name : ''
        let skillFilterid = skillfilter ? skillfilter.id : ''
        const skilldata = await SkillCategory.findAll({
            where: {
                [Op.not]: [
                    { status: DELETE },
                    { status: INACTIVE },
                ]
            },
        })
        await SkillSubCategory.findAndCountAll(options)
            .then((data) => {
                // return res.send(data)
                if (data.count === 0) {
                    res.render('admin/SkillSubCategory/SkillSubCategory', {
                        skilldata,
                        error: 'No data found !',
                        data,
                        searchVal,
                        skillFilterVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        statusfilter,
                        skillFilterid
                    })
                } else {
                    const extra = {
                            per_page: limit,
                            total: data.count,
                            pages: Math.ceil(data.count / limit),
                            pageNo: pageNo
                        }
                        // res.json(data)
                    res.render('admin/SkillSubCategory/SkillSubCategory', {
                        skilldata,
                        data,
                        extra,
                        searchVal,
                        skillFilterVal,
                        skillFilterid,
                        pageNo,
                        limit,
                        message,
                        statusfilter,
                        error
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    Skill_Sub_Categorycreate: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await SkillCategory.findAll({
                where: {
                    status: [
                        ACTIVE, INACTIVE
                    ]
                }
            })
            .then(data => {
                res.render("admin/SkillSubCategory/create-SkillSubCategory", {
                    formValue,
                    message,
                    error,
                    data
                });
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    addSkill_Sub_Categorycreate: async(req, res) => {
        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            skill_category_id: Joi.string().required()
                .messages({
                    'string.empty': `"Skill category" cannot be an empty field`,
                    'any.required': `"Skill category" is a required field`
                }),
            status: Joi.string().required(),
        })
        const {
            error
        } = await schema.validate(reqParams)

        if (error) {
            req.flash('formValue', reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            SkillSubCategory.findOrCreate({
                    where: {
                        name: reqParams.name,
                        skill_category_id: reqParams.skill_category_id
                    },
                })
                .then((SkillSubCategorydata) => {
                    const boolean = SkillSubCategorydata[1];
                    if (boolean) {
                        req.flash('success', 'Skill-sub Category created sucessfully !');
                        res.redirect('/admin/SkillSubCategory')
                    } else {
                        req.flash('formValue', reqParams);
                        req.flash('error', 'Skill Category Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                });
        }
    },

    Skill_Sub_CategoryupdateP: async(req, res) => {
        const formValue = req.flash('formValue')[0];
        const error = req.flash('error')
        const message = req.flash('success')
        const skilldata = await SkillCategory.findAll()

        const id = req.params.id
        await SkillSubCategory.findByPk(id, {
                include: [{
                    model: SkillCategory,
                    where: {
                        [Op.not]: [
                            { status: INACTIVE },
                            { status: DELETE },
                        ]
                    },
                }, ],
            })
            .then((alldata) => {
                res.render('admin/SkillSubCategory/update-skill_Sub_Category', {
                    alldata,
                    formValue,
                    error,
                    message,
                    skilldata
                })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    Skill_Sub_Categoryupdate: async(req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            skill_category_id: Joi.required(),
            status: Joi.required(),
        })
        const {
            error
        } = await schema.validate(data)
        if (error) {
            req.flash('formValue', data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await SkillSubCategory.update(data, {
                    where: {
                        id: id
                    }
                })
                .then((alldata) => {
                    req.flash('success', 'Skill Sub-Category Updated sucessfully !');
                    res.redirect('/admin/SkillSubCategory')
                })
                .catch((error) => {
                    req.flash('error', 'please check your network connection !');
                    res.redirect(req.header('Referer'))
                })
        }

    },

    Skill_Sub_Categorydelete: async(req, res) => {

        const id = req.params.id
        let data = { status: 2 }

        SkillSubCategory.update(data, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Skill Sub-Category Deleted sucessfully !');
                res.redirect('/admin/SkillSubCategory')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/SkillSubCategory')
            })
    },
};