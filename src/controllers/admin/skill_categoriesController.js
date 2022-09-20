const {
    Op
} = require("sequelize");
const Joi = require("@hapi/joi");

const {
    SkillCategory
} = require("../../models");
const { DELETE } = require("../../services/Constants");

module.exports = {

    Skill_Category: async (req, res) => {

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
                [Op.not]: [
                    { status: DELETE},
                ]
            },
            order: sorting,
            offset: offset,
            limit: limit,
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : ''
        let statusfilter = status ? status : ''

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

        await SkillCategory.findAndCountAll(options)
            .then((data) => {   

                // return res.send({data})

                if (!(data.rows.length > 0)) {     
                    res.render('admin/SkillCategory/SkillCategory',  {error: 'No data found !', data,statusfilter, searchVal ,  pageNo, limit, extra: '', message: ''})
                } else {
                    const extra = {
                        per_page : limit,
                        total : data.count,
                        pages : Math.ceil(data.count / limit),
                        pageNo : pageNo
                    }  
                    res.render('admin/SkillCategory/SkillCategory', { data, extra, searchVal ,statusfilter, pageNo, limit, message, error })   
                }
            } )
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    Skill_Categorycreate: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/SkillCategory/create-skill_category", { formValue, message, error  });
    },

    addSkill_Categorycreate: async (req, res) => {
        const reqParams = req.body;
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            status: Joi.string().trim().required(),
        })
        const { error } = await schema.validate(reqParams)
        
        if (error) {
            req.flash('formValue',reqParams);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
 
            SkillCategory.findOrCreate({
                where: {
                    name: reqParams.name,
                    status: reqParams.status
                },
            })
            .then((SkillCategorydata) => {
                const boolean = SkillCategorydata[1];
                    if (boolean) {
                        req.flash('formValue',reqParams);
                        req.flash('success', 'Skill Category created sucessfully !');
                        res.redirect('/admin/SkillCategory')
                    } else {
                        req.flash('formValue',reqParams);
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

    Skill_CategoryupdateP: async (req, res) => {
        const formValue = req.flash('formValue')[0];
        const error = req.flash('error')
        const message = req.flash('success')
        
        const id = req.params.id;

        
        await SkillCategory.findByPk(id)
        .then((alldata) => {
                // console.log(" :: alldata, formValue, error, message :: ", alldata, formValue, error, message);
                res.render('admin/SkillCategory/update-skill_Category', { alldata, formValue, error, message })
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
    },

    Skill_Categoryupdate: async (req, res) => {
        const id = req.params.id
        const data = req.body;

        const schema = Joi.object({
            name: Joi.string().required(),
            status: Joi.string().required(),
        })
        const { error } = await schema.validate(data)
        if (error) {
            req.flash('formValue',data);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await SkillCategory.update(data, {
                    where: {
                        id: id
                    }
            })
            .then(() => {
                req.flash('success', 'Skill Category Updated sucessfully !');
                res.redirect('/admin/SkillCategory')
            })
            .catch((error) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })
        }

    },

    Skill_Categorydelete: async (req, res) => {

        const id = req.params.id
        let data = { status: 2 }

        SkillCategory.update(data, {
            where: {
                id: id
            }
        })     
            .then((data) => {
                req.flash('success', 'Skill Category Deleted sucessfully !');
                res.redirect('/admin/SkillCategory')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('/admin/SkillCategory')
            })
    },
};