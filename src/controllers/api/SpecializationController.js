const { Op } = require('sequelize')
const Response = require('../../services/Response')
const {
    SUCCESS,
    FAIL,
    INTERNAL_SERVER,
    ACTIVE,DELETE
} = require('../../services/Constants')
const { Specialization,Course } = require('../../models')

module.exports = {
    /**
     * @description 'This function is use to  get course list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    CourseList: async (req, res) => {
        const reqParam = req.query
        let query ={};
        if(reqParam.education_id)
        {
          query = {
                where: {
                    education_id:reqParam.education_id,
                  status: {
                      [Op.not]: DELETE,
                  }
              }
          }
        }
        else
        {
            query = {
                where: {
                    status: {
                        [Op.not]: DELETE,
                    }
                }
            }
        }
        await Course.findAndCountAll(query
        ).then((data) => {
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
     * @description 'This function is use to  get Specialization list.'
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    SpecializationList: async (req, res) => {
        const  requestParams = req.params;
        console.log(requestParams);
        await Specialization.findAndCountAll({
            where: {
                course_id:requestParams.course_id,
                status: {
                    [Op.not]: DELETE,
                }
            },
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