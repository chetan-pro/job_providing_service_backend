const Response = require('../../services/Response')
const { User, Permissons, UserPermissions, UserRoles, city, state } = require('../../models')
const Joi = require('@hapi/joi')
const Helper = require('../../services/Helper')
const { sequelize, Op, where } = require("sequelize");
const bcrypt = require('bcrypt')
const jwToken = require('../../services/jwtToken')

const {
    DELETE,
    USER_IMAGE,
    SUCCESS,
    FAIL,
    ACTIVE,
    BAD_REQUEST,
    UNAUTHORIZED,
    INTERNAL_SERVER,
    UN_VERIFY,
    SIGN_UP_REDIRECTION,
    INACTIVE,
    USER_ROLE_TYPE,
} = require('../../services/Constants')

module.exports = {

    addStaff: async(req, res) => {
        const { user_role_type, authUserId } = req;

        let isCompanyData = await User.findByPk(authUserId);

        if (isCompanyData.user_role_type != USER_ROLE_TYPE.company) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('You are not allowed to perform this operation'),
                FAIL
            );
        }

        const reqParam = req.body
        console.log("add staff called");
        // eslint-disable-next-line consistent-return
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            permissions: Joi.array().required(),
            company_id: Joi.number().required(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            password: Joi.string().required(),
            user_role_type: Joi.string().valid(USER_ROLE_TYPE.company_staff).required(),
            your_designation: Joi.string().optional(),
        }

        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam);
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Add-staff ', error))
            )
        } else {
            if (reqParam.email && reqParam.email !== '') {
                const userEmailExist = await User.findOne({
                    where: {
                        email: reqParam.email,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((userEmailData) => userEmailData)

                if (userEmailExist) {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('Email address is already registered with us'),
                        FAIL
                    )
                }
            }

            const user = await User.findOne({
                where: {
                    mobile: reqParam.mobile,
                    status: {
                        [Op.not]: DELETE,
                    },
                },
            }).then((userMobileExistData) => userMobileExistData)

            if (user) {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('Mobile is already registered with us'),
                    FAIL
                )
            }

            const passwordHash = await bcrypt.hashSync(reqParam.password, 10);
            const userObj = {
                name: reqParam.name,
                email: reqParam.email,
                mobile: reqParam.mobile,
                password: passwordHash,
                user_role_type: reqParam.user_role_type,
                company_id: reqParam.company_id,
                your_designation: reqParam.your_designation
            }

            if (reqParam.company_id) {
                let companyDets = await User.findByPk(reqParam.company_id, {
                    include: [{
                        model: city
                    }, {
                        model: state
                    }],
                    attributes: ["id", "name", "pin_code", "state_id", "city_id", "address_line1", "address_line2", "company_link"]
                })

                console.log("companyDets :::: ,", companyDets);

                userObj['state_id'] = companyDets.state_id
                userObj['city_id'] = companyDets.city_id
                userObj['pin_code'] = companyDets.pin_code
                userObj['address_line1'] = companyDets.address_line1
                userObj['address_line2'] = companyDets.address_line2
                userObj['company_link'] = companyDets.company_link
            }

            await User.create(userObj)
                .then(async(result) => {
                    if (result) {
                        // save customer referral
                        await UserRoles.create({
                            userId: result.id,
                            roleType: reqParam.user_role_type.toUpperCase()
                        });
                        const token = jwToken.issueUser({
                            id: result.id,
                            company_id: result.company_id,
                            user_role_type: result.user_role_type,
                        })
                        result.reset_token = token
                        User.update({ reset_token: token }, {
                            where: {
                                email: result.email
                            }
                        }).then(async(updateData) => {
                            if (updateData) {
                                for (var i = 0; i < reqParam.permissions.length; i++) {
                                    console.log(result);
                                    try {
                                        await UserPermissions.create({
                                            userId: result.id,
                                            permissionId: reqParam.permissions[i],
                                            type: result.user_role_type
                                        })
                                    } catch (error) {
                                        return Response.errorResponseData(
                                            res,
                                            res.__('Something went wrong')
                                        )
                                    }

                                }

                                let permissionsData = await User.findAll({
                                    where: {
                                        id: result.id
                                    },
                                    include: [{
                                        model: Permissons
                                    }]
                                })

                                result['permissionsData'] = await permissionsData;

                                return Response.successResponseData(
                                    res,
                                    permissionsData,
                                    SUCCESS,
                                    res.locals.__('Staff added successfully')
                                )

                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.__('Something went wrong')
                                )
                            }
                        }, (e) => {
                            console.log(e)
                            Response.errorResponseData(
                                res,
                                res.__('Internal error'),
                                INTERNAL_SERVER
                            )
                        }).catch(err => {
                            console.log("::::: error , ", err);
                            return Response.errorResponseData(
                                res,
                                res.__('Something went wrong')
                            )
                        })

                    }
                }).catch((e) => {
                    console.log(e)
                    return Response.errorResponseData(
                        res,
                        res.__('Something went wrong')
                    )
                })

        }
    },
    editStaff: async(req, res) => {
        const reqParam = req.body
        const { authUserId } = req;

        console.log("edit staff called");

        let isCompanyData = await User.findByPk(authUserId);

        if (isCompanyData.user_role_type != USER_ROLE_TYPE.company) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('You are not allowed to perform this operation'),
                FAIL
            );
        }

        // eslint-disable-next-line consistent-return
        const reqObj = {
            id: Joi.number().required(),
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            permissions: Joi.array().optional(),
            mobile: Joi.string()
                .trim()
                .min(10)
                .max(10)
                .regex(/^[0-9]*$/)
                .required(),
            your_designation: Joi.string().optional()
        }
        const schema = Joi.object(reqObj)
        const { error } = await schema.validate(reqParam)
        if (error) {
            console.log(res);
            console.log(error);
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('Add-staff ', error))
            )
        } else {
            let userData = await User.findByPk(reqParam.id);
            if (!userData) {
                return Response.errorResponseData(
                    res,
                    res.__('No staff with given id: ' + reqParam.id)
                )
            }

            try {
                if (reqParam.email && reqParam.email != userData.email) {
                    const userEmailExist = await User.findOne({
                        where: {
                            email: reqParam.email,
                            status: {
                                [Op.not]: DELETE,
                            },
                        },
                    }).then((userEmailData) => userEmailData)

                    if (userEmailExist) {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__('Email address is already registered with us'),
                            FAIL
                        )
                    }
                }

                if (reqParam.mobile != userData.mobile) {
                    const user = await User.findOne({
                        where: {
                            mobile: reqParam.mobile,
                            status: {
                                [Op.not]: DELETE,
                            },
                        },
                    }).then((userMobileExistData) => userMobileExistData)

                    if (user) {
                        return Response.errorResponseWithoutData(
                            res,
                            res.locals.__('Mobile is already registered with us'),
                            FAIL
                        )
                    }
                }

                await User.update({
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    your_designation: reqParam.your_designation
                }, {
                    where: {
                        id: reqParam.id
                    }
                });

                if (!reqParam.permissions) {
                    return Response.successResponseWithoutData(res, res.locals.__('Staff edited successfully'), SUCCESS);
                }

                await UserPermissions.destroy({
                    where: {
                        userId: reqParam.id
                    }
                })

                for (var i = 0; i < reqParam.permissions.length; i++) {
                    await UserPermissions.create({
                        userId: reqParam.id,
                        permissionId: reqParam.permissions[i],
                        type: userData.user_role_type
                    })
                }

                return Response.successResponseWithoutData(res, res.locals.__('Staff edited successfully'), SUCCESS);

            } catch (error) {
                return Response.errorResponseData(
                    res,
                    res.__("Something went wrong")
                )
            }
        }
    },
    deleteStaff: async(req, res) => {
        const { id } = req.params;

        const { authUserId } = req;

        console.log("delete staff called");

        let isCompanyData = await User.findByPk(authUserId);

        if (isCompanyData.user_role_type != USER_ROLE_TYPE.company) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('You are not allowed to perform this operation'),
                FAIL
            );
        }

        try {
            let isUserExits = await User.findByPk(id);
            if (!isUserExits) {
                return Response.errorResponseData(
                    res,
                    res.__('No staff with given id: ' + id)
                )
            }
            await User.destroy({
                where: {
                    id: id
                }
            });

            return Response.successResponseWithoutData(res, res.locals.__('Staff Removed Successfully'), SUCCESS);

        } catch (error) {
            return Response.errorResponseData(
                res,
                res.__('Something went wrong')
            )
        }

    },
    getStaff: async(req, res) => {
        const { id, sortBy } = req.query;
        const { authUserId } = req;
        let query = {
            user_role_type: USER_ROLE_TYPE.company_staff,
            company_id: authUserId
        };
        console.log(sortBy);
        let sorting = [
            ['id', sortBy != null ? sortBy : 'DESC']
        ]

        if (id) {
            query['id'] = id;
        }

        try {
            let userData = await User.findAll({
                include: {
                    model: Permissons,
                },
                where: query,
                order: [
                    ['id', 'DESC'],
                ],
                order: sorting
            });

            let successMsg = userData.length != 0 ? res.locals.__('success') : 'No Data Found';

            return Response.successResponseData(
                res,
                userData,
                SUCCESS,
                successMsg,
            )
        } catch (error) {
            return Response.errorResponseWithoutData(
                res,
                res.locals.__('Something went wrong'),
                FAIL
            );
        }

    },
    getStaffPermissions: async(req, res) => {

        let permissionsData = await Permissons.findAll({
            where: {
                is_active: 1,
                type: 'CS'
            },
            order: [
                ['id', 'DESC']
            ]
        })

        let successMsg = res.locals.__('Permissions fetched successfully');

        return Response.successResponseData(
            res,
            permissionsData,
            SUCCESS,
            successMsg,
        )
    },
    activeInActiveStaff: async(req, res, next) => {
        const reqParam = req.body;

        let userData = await User.findByPk(reqParam.id, {
            where: {
                user_role_type: USER_ROLE_TYPE.company_staff
            }
        });

        if (!userData) {
            return next("No data found");
        }

        try {
            await userData.update({
                is_staff_active: reqParam.active
            });

            return Response.successResponseWithoutData(res, res.locals.__('Staff active status updated successfully'), SUCCESS);

            return
        } catch (error) {
            return next(error);
        }

        return res.json(userData);
    }
}