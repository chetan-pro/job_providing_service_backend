const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Helper = require('../../services/Helper')
const Joi = require('@hapi/joi')
const {
    DELETE,
    SUCCESS,
    FAIL,
    ACTIVE,
    BAD_REQUEST,
    UNAUTHORIZED,
    INTERNAL_SERVER
} = require('../../services/Constants')
const { Role } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to Add role.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    RoleAdd: async(req, res) => {
        const requestParams = req.body
        const schema = Joi.object({
            name: Joi.string().trim().required(),
            role_type: Joi.string().required()
        })
        const { error } = await schema.validate(requestParams)
        if (error) {
            return Response.validationErrorResponseData(
                res,
                res.__(Helper.validationMessageKey('addRoleValidation', error))
            )
        } else {
            const RoleTypeExist = await Role.findOne({
                where: {
                    role_type: requestParams.role_type
                },
            }).then((RoleData) => RoleData)

            if (RoleTypeExist) {
                return Response.successResponseWithoutData(
                    res,
                    res.locals.__('roleAlreadyExits'),
                    FAIL
                )
            }
        }
        const roleObj = {
            name: requestParams.name,
            role_type: requestParams.role_type,
        }
        await Role.create(roleObj)
            .then(async(result) => {
                if (result) {
                    return Response.successResponseData(
                        res,
                        result,
                        SUCCESS,
                        res.locals.__('roleAddedSuccessfully')
                    )
                }
            })
            .catch(() => {
                return Response.errorResponseData(
                    res,
                    res.__('somethingWentWrong')
                )
            })
    }
}