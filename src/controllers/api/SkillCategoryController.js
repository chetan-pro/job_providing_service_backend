const { Op } = require('sequelize')
const Response = require('../../services/Response')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    ACTIVE,DELETE
} = require('../../services/Constants')
const { SkillCategory,SkillSubCategory } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get skill category list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    skillCategoryList: async (req, res) => {
        await SkillCategory.findAndCountAll(
            {
                where: {
                    status: {
                        [Op.not]: DELETE,
                    }
                }
            }).then((data) => {
                if (data.rows.length > 0) {
                    return Response.successResponseData(
                        res,
                        data,
                        SUCCESS,
                        res.locals.__('Success')
                    )
                } else {
                    return Response.errorResponseWithoutData(
                        res,
                        res.locals.__('No data found'),
                        FAIL
                    )
                }
            },(e) => {
                console.log(e)
                Response.errorResponseData(
                    res,
                    res.__('Internal error'),
                    INTERNAL_SERVER
                )
            })
    },
    /**
     * @description 'This function is use to  get skill category list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    skillSubCategoryList: async (req, res) => {
      const  requestParams = req.params;
      console.log(requestParams);
        await SkillSubCategory.findAndCountAll({
            where: {
                skill_category_id:requestParams.skill_category_id,
                status: {
                    [Op.not]: DELETE
                }
            },
            //attributes: ['id', 'name','skill_category_id'],
        }).then((data) => {
            if (data.rows.length > 0) {
                return Response.successResponseData(
                    res,
                    data,
                    SUCCESS,
                    res.locals.__('Success')
                )
            } else {
                return Response.errorResponseWithoutData(
                    res,
                    res.locals.__('No data found'),
                    FAIL
                )
            }
        },(e) => {
            console.log(e)
            Response.errorResponseData(
                res,
                res.__('Internal error'),
                INTERNAL_SERVER
            )
        })
    },
}