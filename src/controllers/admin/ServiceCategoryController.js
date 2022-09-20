const { Op } = require('sequelize')
const Joi = require('@hapi/joi')

const { ServiceCategory } = require('../../models')
const { INACTIVE, DELETE } = require('../../services/Constants');

const moment = require("moment");
const path = require("path");
const Helper = require("../../services/Helper");


module.exports ={
    
    showAddServiceCategory: async(req,res) =>{

        console.log(" :: entered into controller :: ,", req);

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        res.render("admin/serviceCategory/createServiceCatrgory",{
            message,
            error,
            formValue
        });
    },

    addServiceCategory: async(req,res) =>{
        const requestParam = req.fields;
        const requestFiles = req.files;
		const reqObj = {
            category_name: Joi.string().required(),
			category_desc: Joi.string().required(),
		};

		const schema = Joi.object(reqObj);
		const { error } = schema.validate(requestParam);

		if (error) {

			let key = error.details[0].message.toUpperCase().split("_").join(" ");
            console.log("  :error.details[0].context ::" , error.details[0].context);
            req.flash('formValue', requestParam);
            req.flash('error',' ', key);

            return res.redirect(req.header('Referer'))
		} else {
                console.log(" :: requestFiles.image ,", requestFiles.image);    

                if(!requestFiles.image.size > 0){
                    req.flash('error', 'Image is required');
                    return res.redirect(`/admin/create-form-service-category`);
                }

                let imageName;
				images = true;
				const extension = requestFiles.image.type;
				const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
				if (requestFiles && requestFiles.image.name.trim() && requestFiles.image && (!imageExtArr.includes(extension))) {
					return req.flash('error', 'Invalid Image');
				}
				imageName = images ? `${requestFiles.image.name.split(".")[0]}${moment().unix()}${path.extname(requestFiles.image.name)}` : '';
				Helper.ImageUpload(req,res,imageName)
			
				const serviceCategoryObj = {
					category_name: requestParam.category_name,
					category_desc: requestParam.category_desc,
                    image : imageName
				};
				await ServiceCategory
					.create(serviceCategoryObj)
					.then(async result => {
                        if(result){
                            req.flash('formValue', requestParam);
                            req.flash('success', 'Service Category added successfully');
                            console.log("req.header ::: , ",req.header);
                            res.redirect(`/admin/create-form-service-category`)
                        }else{
                            req.flash('formValue', requestParam);
                            res.redirect(req.header('Referer'))
                        }
					})
					.catch(e => {
						console.log(e);
                        console.log('370', e)
                        req.flash('formValue', requestParam);
                        req.flash('error', 'Something went wrong');
                        res.redirect(req.header('Referer'))
					});
		}
    },

    showServiceCategory : (req,res) =>{

        // console.log(" :: entered into controller :: ,", req);

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        let page = parseInt(req.query.page) || 1
        var {
            search,
        } = req.query
        
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit

        console.log(" ::search :  ", search);

        let option = {}

        search ? option['where'] = {category_name :{ [Op.like]: `%${search}%`}} : '';
        let searchVal;
        search ? searchVal = search : '';

        console.log(" ::option :  ", option);


        ServiceCategory.findAndCountAll(option).then(statedata =>{ 
            const extra = {
                per_page: limit,
                total: statedata.count,
                pages: Math.ceil(statedata.count / limit),
                pageNo: pageNo,
                limit,
            }

            if(!statedata.rows.length){
                return res.render('admin/serviceCategory/serviceCategory.ejs', {
                    data : statedata,
                    message,
                    error:'No data found !',
                    formValue,
                    extra,
                    searchVal
                  })
            }
           
            res.render("admin/serviceCategory/serviceCategory.ejs",{
                data : statedata,
                message,
                error,
                formValue,
                extra,
                searchVal
            });
        })
        .catch((e) => {
            console.log(e)
            req.flash('error', 'please check your network connection !');
            res.redirect(req.header('Referer'))
          })
    },

    ServiceCategoryDelete: async (req, res) => {
        const id = req.params.id;
        ServiceCategory.destroy({
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Service category Deleted sucessfully !');
                res.redirect('/admin/service-category')
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect('backURL')
            })
    },

    showEditServiceCategory: async(req,res) =>{
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        let id  = req.params.id;

        let alldata  = await ServiceCategory.findOne({
            where :{
                id : id
            }
        })

        res.render("admin/serviceCategory/editServiceCategory",{
            message,
            error,
            formValue,
            alldata
        });
    },

    editServiceCategory: async(req,res) =>{
        const reqParam = req.fields;
        const requestIdParam = req.params.id;

        console.log(" 167 requestIdParam :: ", requestIdParam ," :; reqParam :: ", reqParam);

        const reqObj = {
			category_name: Joi.string().required(),
			category_desc: Joi.string().required(), 
		};
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {

            let key = error.details[0].message.toUpperCase().split("_").join(" ");
            console.log("  :error.details[0].context ::" , error.details[0].context);
            req.flash('formValue', reqParam);
            req.flash('error',' ', key);

        } else {
            await ServiceCategory.findByPk(requestIdParam)
                .then(async(customData) => {
                    if (customData) {
                        const Obj = {
                            category_name: reqParam.category_name,
					        category_desc: reqParam.category_desc,
                        }

                        if(req.files.image && req.files.image.size > 0){
                            Helper.RemoveImage(res, customData.image);

                            let imageName;
				            images = true;
				            const extension = req.files.image.type;
				            const imageExtArr = ['image/jpg',   'application/octet-stream', 'image/jpeg', 'image/png'];
				            if (req.files && req.files.image.name.trim() && req.files.image && (!imageExtArr.includes(extension))) {
				            	return req.flash('error', 'Invalid Image');
				            }
				            imageName = images ? `${req.files.image.name.split(".")[0]}${moment().unix()}${path.extname(req.files.image.name)}` : '';
				            Helper.ImageUpload(req,res,imageName)

                            if(imageName){
                                Obj["image"] = imageName
                            }
                        } 

                        ServiceCategory.update(Obj, {
                            where: {
                                id: requestIdParam
                            },
                        }).then(async(updateData, err) => {
                            if (updateData) {
                                req.flash('formValue', reqParam);
                                req.flash('success', 'Service Category updated successfully');
                                console.log("req.header ::: , ",req.header);
                                res.redirect(`/admin/service-category`)
                            } else {
                                req.flash('formValue', reqParam);
                                res.redirect(req.header('Referer'))
                            }
                        }).catch(async() => {
                            console.log(e);
                            console.log('370', e)
                            req.flash('formValue', reqParam);
                            req.flash('error', 'Something went wrong');
                            res.redirect(req.header('Referer'))
                        })
                    } else {
                        req.flash('formValue', reqParam);
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch(async(e) => {
                    console.log(e)
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Something went wrong');
                    res.redirect(req.header('Referer'))
                })
        }
    }
}


