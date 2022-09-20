const Response = require('../services/Response')
const jwToken = require('../services/jwtToken')
const { User, admin, UserRoles } = require('../models')
const { Op, QueryTypes } = require('sequelize');
const {
    INACTIVE,
    ACTIVE,
    USER_ROLE_TYPE,
    APPROVED,
    DISAPPROVED
} = require('../services/Constants')

module.exports = {

    // common for all
    commonAuth: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, (err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {

                        req.authUserId = decoded.id;
                        req.user_role_type = decoded.user_role_type;

                        if ((decoded.user_role_type != null && decoded.user_role_type == USER_ROLE_TYPE.company_staff || decoded.user_role_type == USER_ROLE_TYPE.company)) {
                            req.companyId = decoded.user_role_type == USER_ROLE_TYPE.company_staff ? decoded.company_id : decoded.id;
                        } else {
                            req.companyId = null;
                        }
                        User.findOne({
                            where: {
                                id: req.authUserId,
                            },
                        }).then((result) => {
                            console.log(" :: useeDetails:: ,", result);

                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // user_role_type JS
    validateCandidate: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded && decoded.id) {
                        req.authUserId = decoded.id

                        // checking role from UserRole Table
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: req.authUserId,
                                roleType: USER_ROLE_TYPE.candidate
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // user_role_type: USER_ROLE_TYPE.candidate
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // user_role_type COMPANY
    validateCompany: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking role from UserRole Table
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: req.authUserId,
                                roleType: USER_ROLE_TYPE.company
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // user_role_type: USER_ROLE_TYPE.company
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // user_role_type C or CS
    validateCompanyOrStaff: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)

            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        console.log(err);
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }

                    // checking role from userRole table
                    let roleExist = await UserRoles.findOne({
                        where: {
                            userId: decoded.id,
                            roleType: {
                                [Op.or]: [USER_ROLE_TYPE.company, USER_ROLE_TYPE.company_staff]
                            }

                        }
                    })

                    if (!roleExist) {
                        return Response.errorResponseData(
                            res,
                            res.locals.__('invalidToken'),
                            401
                        )
                    }

                    if (decoded.id) {

                        req.authUserId = roleExist.roleType == USER_ROLE_TYPE.company_staff ? decoded.company_id : decoded.id;
                        req.user_role_type = roleExist.roleType;

                        req.companyId = roleExist.roleType == USER_ROLE_TYPE.company_staff ? decoded.company_id : decoded.id;
                        req.staff_id = roleExist.roleType == USER_ROLE_TYPE.company_staff ? decoded.id : decoded.company_id;

                        console.log("&&&&&& : req.companyId", req.companyId);

                        console.log(decoded.user_role_type);
                        if (!req.companyId) {
                            return Response.errorResponseData(res, res.locals.__('invalidToken'), 401);
                        }

                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // [Op.or]: [{
                                //         user_role_type: {
                                //             [Op.eq]: USER_ROLE_TYPE.company
                                //         }
                                //     },
                                //     {
                                //         user_role_type: {
                                //             [Op.eq]: USER_ROLE_TYPE.company_staff
                                //         }
                                //     }
                                // ]
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // common middleware for candidate and company
    validateCompanyOrCandidate: async(req, res, next) => {

        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from  userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: {
                                    [Op.or]: [USER_ROLE_TYPE.company, USER_ROLE_TYPE.candidate]
                                }

                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType;
                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // [Op.or]: [{
                                //         user_role_type: {
                                //             [Op.eq]: USER_ROLE_TYPE.company
                                //         }
                                //     },
                                //     {
                                //         user_role_type: {
                                //             [Op.eq]: USER_ROLE_TYPE.candidate
                                //         }
                                //     }
                                // ]
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalid Token'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // user_role_type HSP
    validateHomeServiceProvider: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        return Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: USER_ROLE_TYPE.home_service_provider
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // user_role_type: USER_ROLE_TYPE.home_service_provider
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    // user_role_type HSS
    validateHomeServiceSeeker: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        return Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from  userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: USER_ROLE_TYPE.home_service_seeker
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // user_role_type: USER_ROLE_TYPE.home_service_seeker
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },

    // user_role_type LH
    validateLocalHunar: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from  userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: USER_ROLE_TYPE.local_hunar
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType


                        User.findOne({
                            where: {
                                id: req.authUserId,
                                // user_role_type: USER_ROLE_TYPE.local_hunar
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },

    // Admin
    validateAdmin: async(req, res, next) => {
        const token = req.cookies['x-token'];
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, (err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id
                        admin.findOne({
                            where: {
                                id: req.authUserId,
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },

    // validate (BC,ADVISOR,CM,FSE)
    validateMiscellaneousUser: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from  userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: {
                                    [Op.or]: [USER_ROLE_TYPE.business_correspondence, USER_ROLE_TYPE.advisor, USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.field_sales_executive]
                                }
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }
                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
    validateApprovedMiscellaneousUser: async(req, res, next) => {
        const token = req.headers.authorization
        if (!token) {
            Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
        } else {
            const tokenData = await jwToken.decode(token)
            if (tokenData) {
                jwToken.verify(tokenData, async(err, decoded) => {
                    if (err) {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                    if (decoded.id) {
                        req.authUserId = decoded.id

                        // checking Role from  userRole
                        let roleExist = await UserRoles.findOne({
                            where: {
                                userId: decoded.id,
                                roleType: {
                                    [Op.or]: [USER_ROLE_TYPE.business_correspondence, USER_ROLE_TYPE.advisor, USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.field_sales_executive]
                                }
                            }
                        })

                        if (!roleExist) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        }

                        req.user_role_type = roleExist.roleType

                        User.findOne({
                            where: {
                                id: req.authUserId,
                            },
                        }).then((result) => {
                            if (!result) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('invalidToken'),
                                    401
                                )
                            } else {
                                if (result && result.status === INACTIVE) {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountIsInactive'),
                                        401
                                    )
                                }

                                if (result && result.status === ACTIVE) {
                                    return next()
                                } else {
                                    return Response.errorResponseData(
                                        res,
                                        res.locals.__('accountBlocked'),
                                        401
                                    )
                                }
                            }
                        })
                    } else {
                        Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                    }
                })
            } else {
                Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
            }
        }
    },
}