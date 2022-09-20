const { User, UserRoles, state, city, LocalHunarVideos } = require("../../models");
const { Op } = require("sequelize");
const Joi = require("@hapi/joi");
const bcrypt = require('bcrypt');
const {
    USER_ROLE_TYPE
} = require('../../services/Constants')
const jwToken = require('../../services/jwtToken');
const Helper = require("../../services/Helper");
const moment = require("moment");
const path = require("path");
const fs = require("fs-extra");
const { getVideoDurationInSeconds } = require('get-video-duration')




module.exports = {

    localHunar: async(req, res) => {
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
        if (page) limit = 10;
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
            include: [{
                    model: UserRoles,
                    where: {
                        'roleType': USER_ROLE_TYPE.local_hunar
                    },
                },
                { model: state },
                { model: city },
            ]
        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        let filterVal = filter ? filter : '';
        let sortVal = sort ? sort : '';
        if (search) {
            options['where'] = {
                [Op.and]: [{

                    name: {
                        [Op.like]: `%${search}%`
                    },

                    user_role_type: USER_ROLE_TYPE.local_hunar
                }]
            }

        } else if (filter) {
            options['where'] = {
                [Op.and]: [

                    { status: filter },

                    { user_role_type: USER_ROLE_TYPE.local_hunar }
                ]
            }
        } else if (search && filter) {
            options['where'] = {
                [Op.and]: [

                    {
                        name: {
                            [Op.like]: `%${search}%`
                        }
                    },

                    { status: filter },

                    { user_role_type: USER_ROLE_TYPE.local_hunar }
                ]
            }
        } else {
            filterVal = 1
            options['where'] = {
                [Op.and]: [

                    { status: '1' },

                    { user_role_type: USER_ROLE_TYPE.local_hunar }
                ]
            }
        }

        await User.findAndCountAll(options)
            .then((data) => {
                // return res.send(data.rows)
                if (data.count === 0) {
                    res.render('admin/localHunar/localHunar', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        filterVal,
                        sortVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: ''
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/localHunar/localHunar', {
                        data,
                        extra,
                        searchVal,
                        filterVal,
                        sortVal,
                        pageNo,
                        limit,
                        message,
                        error
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    localHunarDetails: async(req, res) => {
        const id = req.params.id
        const roleType = USER_ROLE_TYPE.local_hunar
        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                ]
            })
            .then((alldata) => {
                console.log(":::::::::::::::::::alldata::::::::::::::");
                console.log(alldata);
                // return res.send(alldata)
                res.render('admin/localHunar/localHunarDetail', { alldata, id, roleType, moment })
            })
            .catch((err) => {
                console.log(err)
            })
    },

    createLocalHunar: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        state.findAll({
                include: [{
                    model: city
                }]
            })
            .then((statedata) => {
                res.render("admin/localHunar/createLocalHunar", {
                    message,
                    error,
                    statedata,
                    formValue
                });
            })

    },

    addLocalHunar: async(req, res) => {

        const reqParam = req.body
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().trim().required(),
            mobile: Joi.string().trim().min(10).max(10).regex(/^[0-9]*$/).required(),
            status: Joi.string(),
            pin_code: Joi.string(),
            dob: Joi.string(),
            state_id: Joi.string().trim().required(),
            city_id: Joi.string().trim().required(),
            password: Joi.string().trim().required(),
            confirm_password: Joi.any().valid(Joi.ref('password')).required(),
        })

        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            console.log(error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            const passwordHash = await bcrypt.hashSync(reqParam.password, 10);

            User.findOrCreate({
                    where: {
                        name: reqParam.name,
                        user_role_type: USER_ROLE_TYPE.local_hunar,
                        email: reqParam.email,
                        mobile: reqParam.mobile,
                        state_id: reqParam.state_id,
                        status: reqParam.status,
                        city_id: reqParam.city_id,
                        password: passwordHash,
                        pin_code: reqParam.pin_code,
                        dob: reqParam.dob
                    },
                })
                .then(async(userdata) => {
                    const user = await UserRoles.create({
                        roleType: USER_ROLE_TYPE.local_hunar,
                        userId: userdata[0].id
                    })
                    const boolean = userdata[1];
                    if (boolean) {

                        const token = jwToken.issueUser({
                            id: userdata[0].id,
                            user_role_type: userdata[0].user_role_type,
                        })
                        userdata[0].reset_token = token
                        User.update({ reset_token: token }, {
                                where: {
                                    email: userdata[0].email
                                }
                            })
                            .then((updateUser) => {
                                req.flash('formValue', reqParam);
                                req.flash('success', 'Local Hunar created sucessfully !');
                                res.redirect('/admin/local-Hunar')
                            })
                    } else {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Local Hunar Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                    res.redirect(req.header('Referer'))
                });
        }
    },

    editLocalHunar: async(req, res) => {

        const id = req.params.id;
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await User.findByPk(id, {
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
                        res.render("admin/localHunar/editLocalHunar", {
                            message,
                            error,
                            statedata,
                            alldata,
                            formValue,
                            moment
                        });
                    });
            })
            .catch((err) => {
                console.log("chetan check this err.details[0].message");
                console.log(err.details[0].message);
                req.flash('formValue', reqParam);
                req.flash('error', ` ${err.details[0].message}`, );
                res.redirect(req.header('Referer'))
            });
    },

    updateLocalHunar: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const alldata = req.flash('alldata')[0];
        const id = req.params.id;
        const reqParam = req.body;
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            email: Joi.string().trim().required(),
            mobile: Joi.string().trim().min(10).max(10).regex(/^[0-9]*$/).required(),
            status: Joi.string(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required()
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            dob: Joi.string().required()
                .messages({
                    'string.empty': `"Date of Birth" cannot be an empty field`,
                    'any.required': `"Date of Birth" is a required field`
                }),
            state_id: Joi.string().trim().required(),
            city_id: Joi.string().trim().required(),
        });
        const { err } = await schema.validate(reqParam);
        if (err) {
            req.flash('alldata', reqParam);
            req.flash('error', 'please fill the field : ', err.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await User.update(reqParam, {
                    where: {
                        id: id,
                    },
                }).then((reqParam) => {
                    req.flash('alldata', reqParam);
                    req.flash("success", "Local Hunar Updated sucessfully !");
                    res.redirect(req.header('Referer'))
                })
                .catch((err) => {
                    req.flash('alldata', reqParam);
                    req.flash("error", err);
                    res.redirect(req.header('Referer'))
                })
        }
    },

    deleteLocalHunar: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id
        User.update({ status: '2' }, {
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

    pendingVideoPermissions: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                approved: 'p '
            },
            offset: offset,
            limit: limit,
            include: {
                model: User
            }

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        if (search) {
            options['where'] = {
                [Op.and]: [{

                    title: {
                        [Op.like]: `%${search}%`
                    },

                    approved: 'p    '
                }]
            }
        }


        await LocalHunarVideos.findAndCountAll(options)
            .then((data) => {
                // return res.send(data.rows)
                if (data.count === 0) {
                    res.render('admin/localHunar/permissionPage', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        pageName: 'pendingList'
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/localHunar/permissionPage', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        pageName: 'pendingList'

                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    activeVideoPermissions: async(req, res) => {
        const message = req.flash('success')
        const error = req.flash('error')
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                [Op.or]: [
                    { approved: 'y' },
                    { approved: 'n' },
                ]
            },
            offset: offset,
            limit: limit,
            include: {
                model: User
            }

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        if (search) {
            options['where'] = {
                [Op.and]: [{

                    title: {
                        [Op.like]: `%${search}%`
                    },
                    [Op.or]: [
                        { approved: 'y' },
                        { approved: 'n' },
                    ]

                }]
            }
        }

        await LocalHunarVideos.findAndCountAll(options)
            .then((data) => {
                // return res.send(data.rows)
                if (data.count === 0) {
                    res.render('admin/localHunar/permissionPage', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        pageName: 'activeList'
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/localHunar/permissionPage', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        pageName: 'activeList'

                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                res.redirect(req.header('Referer'))
            })

    },

    approveVideo: async(req, res) => {
        const id = req.params.id;
        const message = req.flash('success')
        const error = req.flash('error')

        LocalHunarVideos.update({ approved: "y" }, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('success', 'Video Approved');
                res.redirect(req.header('Referer'))
            })
    },

    disapproveVideo: async(req, res) => {

        const id = req.params.id;
        const message = req.flash('success')
        const error = req.flash('error')

        LocalHunarVideos.update({ approved: "n" }, {
                where: {
                    id: id
                }
            })
            .then((data) => {
                req.flash('error', 'Video Disapproved');
                res.redirect(req.header('Referer'))
            })
    },

    userVideos: async(req, res) => {

        const message = req.flash('success')
        const error = req.flash('error')
        const id = req.params.id
        let page = parseInt(req.query.page) || 1
        var {
            search
        } = req.query
        let limit = null;
        if (page) limit = 5;
        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        const options = {
            where: {
                user_id: id
            },
            offset: offset,
            limit: limit,

        };
        if (limit) options['limit'] = limit;
        let searchVal = search ? search : '';
        if (search) {
            options['where'] = {
                [Op.and]: [{

                    title: {
                        [Op.like]: `%${search}%`
                    },

                    user_id: id
                }]
            }
        }


        await LocalHunarVideos.findAndCountAll(options)
            .then((data) => {
                // return res.send(data.rows) assets/videos/sleek-animation1649239637.mp4
                if (data.count === 0) {
                    res.render('admin/localHunar/userVideos', {
                        error: 'No data found !',
                        data,
                        searchVal,
                        pageNo,
                        limit,
                        extra: '',
                        message: '',
                        id
                    })
                } else {
                    const extra = {
                        per_page: limit,
                        total: data.count,
                        pages: Math.ceil(data.count / limit),
                        pageNo: pageNo
                    }
                    res.render('admin/localHunar/userVideos', {
                        data,
                        extra,
                        searchVal,
                        pageNo,
                        limit,
                        message,
                        error,
                        id
                    })
                }
            })
            .catch((e) => {
                req.flash('error', 'please check your network connection !');
                // res.redirect(req.header('Referer'))
                res.send(e)
            })
    },

    createVideo: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id
        res.render("admin/localHunar/createLocalHunarVideo", {
            message,
            error,
            formValue,
            id
        })
    },

    addVideo: async(req, res) => {
        const reqParam = req.fields;

        const id = req.params.id
        const schema = Joi.object({
            title: Joi.string().trim().required(),
            description: Joi.string().optional().allow(''),
        })

        let videos;
        const { error } = await schema.validate(reqParam)

        if (error) {
            console.log(error)
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            if (!req.files) {
                req.flash('formValue', reqParam);
                req.flash('error', 'Video is required');
                res.redirect(req.header('Referer'))
            }
            console.log(" :; req.files :; ", req.files);
            videos = true;
            const extension = req.files.url.type;
            console.log("extension :: ", extension);
            const videoExtension = [
                "video/mp4",
                "video/webm",
                "video/x-m4v",
                "video/mkv",
                "video/quicktime",
                "application/octet-stream",
                "video/x-matroska"
            ];

            // console.log(" extension :::: ,fields.video.type ::: ", req.fields.video.type);
            if (req.files.url && req.files.url.size > 0 && !videoExtension.includes(extension)) {
                req.flash('formValue', reqParam);
                req.flash('error', 'Video invalid !');
                res.redirect(req.header('Referer'))
            }

            let videoName = videos ? `${req.files.url.name.split(".")[0]}${moment().unix()}${path.extname(req.files.url.name)}` : "";
            req.files.video = await req.files.url;
            Helper.VideoUpload(req, res, videoName);

            let src = `http://localhost:3002/assets/videos/${videoName}`;
            // let src = `${process.env.assetsUrl}/assets/videos/${videoName}`;

            let length;
            await getVideoDurationInSeconds(src).then(async(duration) => {
                duration = duration * 1000;
                length = new Date(duration).toISOString().slice(11, 19)

            }).catch(err => console.log(" : err :: ,", err))

            LocalHunarVideos.findOrCreate({
                    where: {
                        user_id: id,
                        url: videoName,
                        title: reqParam.title,
                        description: reqParam.description,
                        approved: 'y',
                        length: length,
                        views: 0
                    },
                })
                .then(async(createdVideo) => {
                    const boolean = createdVideo[1];
                    if (boolean) {
                        req.flash('success', 'Video created sucessfully !');
                        res.redirect(`/admin/local-hunar/${id}/videos`)
                    } else {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Video Already Exists !');
                        res.redirect(req.header('Referer'))
                    }
                })
                .catch((err) => {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Please check your network connection !');
                    res.redirect(req.header('Referer'))
                    console.log(err);
                });
        }
    },

    editVideo: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const id = req.params.id

        LocalHunarVideos.findByPk(id)
            .then((alldata) => {
                // return res.send(alldata)
                res.render("admin/localHunar/editLocalHunarVideo", {
                    message,
                    error,
                    formValue,
                    alldata

                })
            })

    },

    updateVideo: async(req, res) => {

        const error = req.flash('error')
        const message = req.flash('success')
        const alldata = req.flash('alldata')[0];
        const id = req.params.id;
        const reqParam = req.body;

        const schema = Joi.object({
            url: Joi.string().trim().required(),
            title: Joi.string().trim().required(),
            description: Joi.string().optional().allow(''),
            approved: Joi.string().required(),
        });

        let localHunarDetails = await LocalHunarVideos.findByPk(id);

        const { err } = await schema.validate(reqParam);
        if (err) {
            req.flash('alldata', reqParam);
            req.flash('error', 'please fill the field : ', err.details[0].message);
            res.redirect(req.header('Referer'))
        } else {
            await LocalHunarVideos.update(reqParam, {
                    where: {
                        id: id,
                    },
                }).then((reqParam) => {
                    req.flash('alldata', reqParam);
                    req.flash("success", "Local Hunar Video sucessfully !");
                    res.redirect(`/admin/local-hunar/${localHunarDetails.user_id}/videos`)
                })
                .catch((err) => {
                    req.flash('alldata', reqParam);
                    req.flash("error", err);
                    res.redirect(req.header('Referer'))
                })
        }
    },

    deleteVideo: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id

        let videoDetails = await LocalHunarVideos.findByPk(id)
        Helper.RemoveVideo(res, videoDetails.url)

        await LocalHunarVideos.destroy({
                where: {
                    id: id
                }
            })
            .then(async(data) => {
                req.flash("error", "Video Deleted sucessfully !");
                res.redirect(req.header('Referer'))
            })
            .catch((err) => {
                req.flash('error', 'Please check your network connection OR Email ALready Exists !');
                res.redirect(req.header('Referer'))
            })
    }
}