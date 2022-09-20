const { User, UserRoles, state, city, userInfo, currentBussiness, WalletSettlements, WalletTransactions, UserReferral, SubscribedUser } = require("../../models");
const { Op } = require("sequelize");
const Joi = require("@hapi/joi");
const bcrypt = require('bcrypt');
const moment = require('moment');
const Mailer = require('../../services/Mailer');
const path = require("path");
const Helper = require('../../services/Helper')
const { Sequelize } = require("sequelize");

const {
    USER_ROLE_TYPE,
    DELETE,
    YES,
    NO,
    APPROVED,
    DISAPPROVED
} = require('../../services/Constants')
const jwToken = require('../../services/jwtToken');
const { min } = require("moment");


var fs = require('fs');
var excel = require('excel4node');

module.exports = {

    showMiscellaneousRoles: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        var {
            search,
            roleFilter,
            download_details
        } = req.query

        console.log("roleFilter");
        console.log(roleFilter);
        console.log("roleFilter checking");
        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 10;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let whereOptions = {
            user_role_type: [USER_ROLE_TYPE.business_correspondence, USER_ROLE_TYPE.cluster_manager, USER_ROLE_TYPE.field_sales_executive, USER_ROLE_TYPE.advisor],
            status: {
                [Op.ne]: DELETE
            },
        }
        search ? whereOptions['name'] = {
            [Op.like]: `%${search}%`
        } : '';
        roleFilter ? whereOptions['user_role_type'] = roleFilter : '';
        var now = new Date();
        var monthDate = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + 01;
        console.log("monthDate");
        console.log(monthDate);
        User.findAndCountAll({
            where: whereOptions,
            include: [
                { model: city },
                { model: state },
                { model: currentBussiness, include: [{ model: state }, { model: city }] },
                { model: userInfo },
                {
                    model: WalletTransactions,
                    where: {
                        createdAt: {
                            [Op.gt]: new Date(monthDate)
                        }
                    },
                    required: false

                }
            ],
            limit: limit,
            offset: offset,
        }).then(statedata => {
            const extra = {
                per_page: limit,
                total: statedata.count,
                pages: Math.ceil(statedata.count / limit),
                pageNo: pageNo,
                limit
            }

            if (statedata.count === 0) {
                return res.render('admin/MiscellaneousRole/miscellaneousRole.ejs', {
                    error: 'No data found !',
                    data: statedata,
                    message,
                    formValue,
                    extra,
                    search,
                    roleFilter
                })
            }

            // / return res.send( statedata )
            // currentBussiness , userInfo

            if (download_details) {
                //excel file config---
                var workbook = new excel.Workbook();
                var worksheet = workbook.addWorksheet('MiscellaneousUsers');
                var style = workbook.createStyle({
                    font: {
                        color: '#EA3A14',
                        size: 18
                    },
                    // numberFormat: '$#,##0.00; ($#,##0.00); -',
                    shrinkToFit: true,
                });

                var styleForData = workbook.createStyle({
                    font: {
                        color: '#47180E',
                        size: 12
                    },
                    alignment: {
                        wrapText: false,
                        horizontal: 'left',
                    },
                    shrinkToFit: true,
                    // numberFormat: '$#,##0.00; ($#,##0.00); -'
                });

                //Tab 1 headers
                worksheet.cell(1, 1).string('S.No').style(style);
                worksheet.cell(1, 2).string('id').style(style);
                worksheet.cell(1, 3).string('Name').style(style);
                worksheet.cell(1, 4).string('Email').style(style);
                worksheet.cell(1, 5).string('Gender').style(style);
                worksheet.cell(1, 6).string('DOB').style(style);
                worksheet.cell(1, 7).string('State').style(style);
                worksheet.cell(1, 8).string('City').style(style);
                worksheet.cell(1, 9).string('Mobile').style(style);
                worksheet.cell(1, 10).string('linkedIn Id').style(style);

                // userInfo
                worksheet.cell(1, 11).string('Residence No').style(style);
                worksheet.cell(1, 12).string('Office No').style(style);
                worksheet.cell(1, 13).string('Whatsapp No').style(style);
                worksheet.cell(1, 14).string('Education Qualification').style(style);
                worksheet.cell(1, 15).string('Adhar No').style(style);
                worksheet.cell(1, 16).string('Pan No').style(style);

                // currentBussiness
                worksheet.cell(1, 17).string('Current Bussiness').style(style);
                worksheet.cell(1, 18).string('Bussiness Type').style(style);
                worksheet.cell(1, 19).string('Bussiness Name').style(style);
                worksheet.cell(1, 20).string('House Name').style(style);
                worksheet.cell(1, 21).string('Municipality').style(style);
                worksheet.cell(1, 22).string('Pincode').style(style);
                worksheet.cell(1, 23).string('Bussiness Years').style(style);
                worksheet.cell(1, 24).string('Current Income PA').style(style);
                worksheet.cell(1, 25).string('No Customers').style(style);

                //Some logic
                function generateExcelSheetUser(array, worksheet) {
                    let row = 2; //Row starts from 2 as 1st row is for headers.
                    for (let i in array) {
                        let o = 1;

                        console.log(" :: array[i].id :: ", array[i].id);

                        //This depends on numbers of columns to fill.
                        worksheet.cell(row, o).number(o).style(styleForData);
                        worksheet.cell(row, o + 1).number(array[i].id).style(styleForData);
                        worksheet.cell(row, o + 2).string(array[i].name).style(styleForData);
                        worksheet.cell(row, o + 3).string(array[i].email).style(styleForData);
                        worksheet.cell(row, o + 4).string(array[i].gender).style(styleForData);
                        worksheet.cell(row, o + 5).string(array[i].dob).style(styleForData);
                        worksheet.cell(row, o + 6).string(array[i].state.name).style(styleForData);
                        worksheet.cell(row, o + 7).string(array[i].city.name).style(styleForData);
                        worksheet.cell(row, o + 8).string(array[i].mobile).style(styleForData);
                        worksheet.cell(row, o + 9).string(array[i].linkedIn_id).style(styleForData);


                        if (array[i].userInfo) {
                            worksheet.cell(row, o + 10).string(array[i].userInfo.residence_no).style(styleForData);
                            worksheet.cell(row, o + 11).string(array[i].userInfo.office_no).style(styleForData);
                            worksheet.cell(row, o + 12).string(array[i].userInfo.whatsapp_no).style(styleForData);
                            worksheet.cell(row, o + 13).string(array[i].userInfo.education_qualification).style(styleForData);
                            worksheet.cell(row, o + 14).string(array[i].userInfo.adhar_no).style(styleForData);
                            worksheet.cell(row, o + 15).string(array[i].userInfo.pan_no).style(styleForData);
                        }

                        if (array[i].currentBussiness) {
                            worksheet.cell(row, o + 16).string(array[i].currentBussiness.current_bussiness).style(styleForData);
                            worksheet.cell(row, o + 17).string(array[i].currentBussiness.bussiness_type).style(styleForData);
                            worksheet.cell(row, o + 18).string(array[i].currentBussiness.bussiness_name).style(styleForData);
                            worksheet.cell(row, o + 19).string(array[i].currentBussiness.house_name).style(styleForData);
                            worksheet.cell(row, o + 20).string(array[i].currentBussiness.municipality).style(styleForData);
                            worksheet.cell(row, o + 21).number(array[i].currentBussiness.pincode).style(styleForData);
                            worksheet.cell(row, o + 22).number(array[i].currentBussiness.bussiness_years).style(styleForData);
                            worksheet.cell(row, o + 23).number(array[i].currentBussiness.current_income_pa).style(styleForData);
                            worksheet.cell(row, o + 24).number(array[i].currentBussiness.no_customers).style(styleForData);
                        }

                        row = row + 1;
                    }
                }

                generateExcelSheetUser(statedata.rows, worksheet);
                workbook.write('./excelSheet/Excel.xlsx')


            }

            return res.render("admin/MiscellaneousRole/miscellaneousRole.ejs", {
                data: statedata,
                message,
                error,
                formValue,
                extra,
                search,
                roleFilter
            });
        })
    },

    showbusinessPartnerTransaction: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        var {
            search,
            roleFilter,
            download_details
        } = req.query
        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 5;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let whereOptions = {
            status: {
                [Op.ne]: DELETE
            },
        }

        search ? whereOptions['name'] = {
            [Op.like]: `%${search}%`
        } : '';
        whereOptions['admin_approved'] = 1;

        WalletSettlements.findAndCountAll({
            include: [{
                model: User,
                where: whereOptions,
            }],
            limit: limit,
            offset: offset,
        }).then(statedata => {
            console.log(":::::::::::::::statedata::::::::");
            console.log(statedata.rows[0].Users[0].name);
            console.log(statedata.count);
            console.log("?????????????statedata.count???????????????");
            const extra = {
                per_page: limit,
                total: statedata.count,
                pages: Math.ceil(statedata.count / limit),
                pageNo: pageNo,
                limit
            }

            if (statedata.count === 0) {
                return res.render('admin/MiscellaneousRole/transactionBusinessPartner.ejs', {
                    error: 'No data found !',
                    data: statedata,
                    message,
                    formValue,
                    extra,
                    search,
                    roleFilter,
                    moment
                })
            }

            // / return res.send( statedata )
            // currentBussiness , userInfo

            if (download_details) {
                //excel file config---
                var workbook = new excel.Workbook();
                var worksheet = workbook.addWorksheet('MiscellaneousUsers');
                var style = workbook.createStyle({
                    font: {
                        color: '#EA3A14',
                        size: 18
                    },
                    // numberFormat: '$#,##0.00; ($#,##0.00); -',
                    shrinkToFit: true,
                });

                var styleForData = workbook.createStyle({
                    font: {
                        color: '#47180E',
                        size: 12
                    },
                    alignment: {
                        wrapText: false,
                        horizontal: 'left',
                    },
                    shrinkToFit: true,
                    // numberFormat: '$#,##0.00; ($#,##0.00); -'
                });

                //Tab 1 headers
                worksheet.cell(1, 1).string('S.No').style(style);
                worksheet.cell(1, 2).string('id').style(style);
                worksheet.cell(1, 3).string('Name').style(style);
                worksheet.cell(1, 4).string('Email').style(style);
                worksheet.cell(1, 5).string('Gender').style(style);
                worksheet.cell(1, 6).string('DOB').style(style);
                worksheet.cell(1, 7).string('State').style(style);
                worksheet.cell(1, 8).string('City').style(style);
                worksheet.cell(1, 9).string('Mobile').style(style);
                worksheet.cell(1, 10).string('linkedIn Id').style(style);

                // userInfo
                worksheet.cell(1, 11).string('Residence No').style(style);
                worksheet.cell(1, 12).string('Office No').style(style);
                worksheet.cell(1, 13).string('Whatsapp No').style(style);
                worksheet.cell(1, 14).string('Education Qualification').style(style);
                worksheet.cell(1, 15).string('Adhar No').style(style);
                worksheet.cell(1, 16).string('Pan No').style(style);

                // currentBussiness
                worksheet.cell(1, 17).string('Current Bussiness').style(style);
                worksheet.cell(1, 18).string('Bussiness Type').style(style);
                worksheet.cell(1, 19).string('Bussiness Name').style(style);
                worksheet.cell(1, 20).string('House Name').style(style);
                worksheet.cell(1, 21).string('Municipality').style(style);
                worksheet.cell(1, 22).string('Pincode').style(style);
                worksheet.cell(1, 23).string('Bussiness Years').style(style);
                worksheet.cell(1, 24).string('Current Income PA').style(style);
                worksheet.cell(1, 25).string('No Customers').style(style);

                //Some logic
                function generateExcelSheetUser(array, worksheet) {
                    let row = 2; //Row starts from 2 as 1st row is for headers.
                    for (let i in array) {
                        let o = 1;

                        console.log(" :: array[i].id :: ", array[i].id);

                        //This depends on numbers of columns to fill.
                        worksheet.cell(row, o).number(o).style(styleForData);
                        worksheet.cell(row, o + 1).number(array[i].id).style(styleForData);
                        worksheet.cell(row, o + 2).string(array[i].name).style(styleForData);
                        worksheet.cell(row, o + 3).string(array[i].email).style(styleForData);
                        worksheet.cell(row, o + 4).string(array[i].gender).style(styleForData);
                        worksheet.cell(row, o + 5).string(array[i].dob).style(styleForData);
                        worksheet.cell(row, o + 6).string(array[i].state.name).style(styleForData);
                        worksheet.cell(row, o + 7).string(array[i].city.name).style(styleForData);
                        worksheet.cell(row, o + 8).string(array[i].mobile).style(styleForData);
                        worksheet.cell(row, o + 9).string(array[i].linkedIn_id).style(styleForData);


                        if (array[i].userInfo) {
                            worksheet.cell(row, o + 10).string(array[i].userInfo.residence_no).style(styleForData);
                            worksheet.cell(row, o + 11).string(array[i].userInfo.office_no).style(styleForData);
                            worksheet.cell(row, o + 12).string(array[i].userInfo.whatsapp_no).style(styleForData);
                            worksheet.cell(row, o + 13).string(array[i].userInfo.education_qualification).style(styleForData);
                            worksheet.cell(row, o + 14).string(array[i].userInfo.adhar_no).style(styleForData);
                            worksheet.cell(row, o + 15).string(array[i].userInfo.pan_no).style(styleForData);
                        }

                        if (array[i].currentBussiness) {
                            worksheet.cell(row, o + 16).string(array[i].currentBussiness.current_bussiness).style(styleForData);
                            worksheet.cell(row, o + 17).string(array[i].currentBussiness.bussiness_type).style(styleForData);
                            worksheet.cell(row, o + 18).string(array[i].currentBussiness.bussiness_name).style(styleForData);
                            worksheet.cell(row, o + 19).string(array[i].currentBussiness.house_name).style(styleForData);
                            worksheet.cell(row, o + 20).string(array[i].currentBussiness.municipality).style(styleForData);
                            worksheet.cell(row, o + 21).number(array[i].currentBussiness.pincode).style(styleForData);
                            worksheet.cell(row, o + 22).number(array[i].currentBussiness.bussiness_years).style(styleForData);
                            worksheet.cell(row, o + 23).number(array[i].currentBussiness.current_income_pa).style(styleForData);
                            worksheet.cell(row, o + 24).number(array[i].currentBussiness.no_customers).style(styleForData);
                        }

                        row = row + 1;
                    }
                }
                generateExcelSheetUser(statedata.rows, worksheet);
                workbook.write('./excelSheet/Excel.xlsx')
            }
            return res.render("admin/MiscellaneousRole/transactionBusinessPartner.ejs", {
                data: statedata,
                message,
                error,
                formValue,
                extra,
                search,
                roleFilter,
                moment
            });
        }).catch((error) => {
            console.log(error);
            return res.render('admin/MiscellaneousRole/transactionBusinessPartner.ejs', {
                error: 'No data found !',
                data: { rows: [] },
                message: error,
                formValue,
                search,
                roleFilter,
                moment
            })
        })
    },
    showUnApprovedBusinessPartnerRoles: (req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        var {
            search,
            roleFilter,
            download_details
        } = req.query
        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 10;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit
        let whereOptions = {
            status: {
                [Op.ne]: DELETE
            },
        }
        let sorting = [
            ['id', 'DESC']
        ]
        search ? whereOptions['name'] = {
            [Op.like]: `%${search}%`
        } : '';
        whereOptions['admin_approved'] = 0;

        User.findAndCountAll({
            where: whereOptions,
            include: [{
                    model: currentBussiness,
                    include: [{ model: state }, { model: city }],
                    required: true,
                    where: {
                        ref1_name: {
                            [Op.ne]: null
                        }
                    }
                },
                { model: userInfo, required: true }
            ],
            limit: limit,
            offset: offset,
            order: sorting
        }).then(statedata => {
            console.log(statedata);
            console.log(statedata.count);
            const extra = {
                per_page: limit,
                total: statedata.count,
                pages: Math.ceil(statedata.count / limit),
                pageNo: pageNo,
                limit
            }

            if (statedata.count === 0) {
                return res.render('admin/MiscellaneousRole/unapprovedBusinessPartner.ejs', {
                    error: 'No data found !',
                    data: statedata,
                    message,
                    formValue,
                    extra,
                    search,
                    roleFilter
                })
            }

            // / return res.send( statedata )
            // currentBussiness , userInfo

            if (download_details) {
                //excel file config---
                var workbook = new excel.Workbook();
                var worksheet = workbook.addWorksheet('MiscellaneousUsers');
                var style = workbook.createStyle({
                    font: {
                        color: '#EA3A14',
                        size: 18
                    },
                    // numberFormat: '$#,##0.00; ($#,##0.00); -',
                    shrinkToFit: true,
                });

                var styleForData = workbook.createStyle({
                    font: {
                        color: '#47180E',
                        size: 12
                    },
                    alignment: {
                        wrapText: false,
                        horizontal: 'left',
                    },
                    shrinkToFit: true,
                    // numberFormat: '$#,##0.00; ($#,##0.00); -'
                });

                //Tab 1 headers
                worksheet.cell(1, 1).string('S.No').style(style);
                worksheet.cell(1, 2).string('id').style(style);
                worksheet.cell(1, 3).string('Name').style(style);
                worksheet.cell(1, 4).string('Email').style(style);
                worksheet.cell(1, 5).string('Gender').style(style);
                worksheet.cell(1, 6).string('DOB').style(style);
                worksheet.cell(1, 7).string('State').style(style);
                worksheet.cell(1, 8).string('City').style(style);
                worksheet.cell(1, 9).string('Mobile').style(style);
                worksheet.cell(1, 10).string('linkedIn Id').style(style);

                // userInfo
                worksheet.cell(1, 11).string('Residence No').style(style);
                worksheet.cell(1, 12).string('Office No').style(style);
                worksheet.cell(1, 13).string('Whatsapp No').style(style);
                worksheet.cell(1, 14).string('Education Qualification').style(style);
                worksheet.cell(1, 15).string('Adhar No').style(style);
                worksheet.cell(1, 16).string('Pan No').style(style);

                // currentBussiness
                worksheet.cell(1, 17).string('Current Bussiness').style(style);
                worksheet.cell(1, 18).string('Bussiness Type').style(style);
                worksheet.cell(1, 19).string('Bussiness Name').style(style);
                worksheet.cell(1, 20).string('House Name').style(style);
                worksheet.cell(1, 21).string('Municipality').style(style);
                worksheet.cell(1, 22).string('Pincode').style(style);
                worksheet.cell(1, 23).string('Bussiness Years').style(style);
                worksheet.cell(1, 24).string('Current Income PA').style(style);
                worksheet.cell(1, 25).string('No Customers').style(style);

                //Some logic
                function generateExcelSheetUser(array, worksheet) {
                    let row = 2; //Row starts from 2 as 1st row is for headers.
                    for (let i in array) {
                        let o = 1;

                        console.log(" :: array[i].id :: ", array[i].id);

                        //This depends on numbers of columns to fill.
                        worksheet.cell(row, o).number(o).style(styleForData);
                        worksheet.cell(row, o + 1).number(array[i].id).style(styleForData);
                        worksheet.cell(row, o + 2).string(array[i].name).style(styleForData);
                        worksheet.cell(row, o + 3).string(array[i].email).style(styleForData);
                        worksheet.cell(row, o + 4).string(array[i].gender).style(styleForData);
                        worksheet.cell(row, o + 5).string(array[i].dob).style(styleForData);
                        worksheet.cell(row, o + 6).string(array[i].state.name).style(styleForData);
                        worksheet.cell(row, o + 7).string(array[i].city.name).style(styleForData);
                        worksheet.cell(row, o + 8).string(array[i].mobile).style(styleForData);
                        worksheet.cell(row, o + 9).string(array[i].linkedIn_id).style(styleForData);


                        if (array[i].userInfo) {
                            worksheet.cell(row, o + 10).string(array[i].userInfo.residence_no).style(styleForData);
                            worksheet.cell(row, o + 11).string(array[i].userInfo.office_no).style(styleForData);
                            worksheet.cell(row, o + 12).string(array[i].userInfo.whatsapp_no).style(styleForData);
                            worksheet.cell(row, o + 13).string(array[i].userInfo.education_qualification).style(styleForData);
                            worksheet.cell(row, o + 14).string(array[i].userInfo.adhar_no).style(styleForData);
                            worksheet.cell(row, o + 15).string(array[i].userInfo.pan_no).style(styleForData);
                        }

                        if (array[i].currentBussiness) {
                            worksheet.cell(row, o + 16).string(array[i].currentBussiness.current_bussiness).style(styleForData);
                            worksheet.cell(row, o + 17).string(array[i].currentBussiness.bussiness_type).style(styleForData);
                            worksheet.cell(row, o + 18).string(array[i].currentBussiness.bussiness_name).style(styleForData);
                            worksheet.cell(row, o + 19).string(array[i].currentBussiness.house_name).style(styleForData);
                            worksheet.cell(row, o + 20).string(array[i].currentBussiness.municipality).style(styleForData);
                            worksheet.cell(row, o + 21).number(array[i].currentBussiness.pincode).style(styleForData);
                            worksheet.cell(row, o + 22).number(array[i].currentBussiness.bussiness_years).style(styleForData);
                            worksheet.cell(row, o + 23).number(array[i].currentBussiness.current_income_pa).style(styleForData);
                            worksheet.cell(row, o + 24).number(array[i].currentBussiness.no_customers).style(styleForData);
                        }

                        row = row + 1;
                    }
                }

                generateExcelSheetUser(statedata.rows, worksheet);
                workbook.write('./excelSheet/Excel.xlsx')


            }

            return res.render("admin/MiscellaneousRole/unapprovedBusinessPartner.ejs", {
                data: statedata,
                message,
                error,
                formValue,
                extra,
                search,
                roleFilter
            });
        }).catch((error) => {
            console.log(error);
            return res.render('admin/MiscellaneousRole/unapprovedBusinessPartner.ejs', {
                error: 'No data found !',
                data: statedata,
                message: error,
                formValue,
                extra,
                search,
                roleFilter
            })
        })
    },

    approveBusinessPartner: async(req, res) => {
        const id = req.params.id
        const reqParam = req.fields;


        let userObj = {
            admin_approved: APPROVED
        }
        const userData = await User.findOne({
            where: {
                id: id
            },
            include: [{
                model: state,
                attributes: ['id', 'code'],
                id: {
                    [Op.eq]: ['state_id'],
                },
            }, ]
        });


        userObj
            = {...userObj,
                referrer_code: await Helper.uniqueReferalCode(userData.state.code, userData.user_role_type, id)
            };

        await User.update(userObj, {
                where: {
                    id: id
                }
            })
            .then((data) => {

                req.flash('success', 'User Updated sucessfully !');
                res.redirect('/admin/unapproved-business-partner-roles')
            })
            .catch((error) => {
                console.log("::::::::::::::::::::::::::::error:::::::::::::::::::::::::::::::::::");
                console.log(error);
                req.flash('error', `${error}`);
                res.redirect(req.header('Referer'))
            })




    },

    showMiscellaneousUserDetails: async(req, res) => {
        const id = req.params.id
        const roleType = USER_ROLE_TYPE.business_correspondence

        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                    { model: currentBussiness, include: [{ model: state }, { model: city }] },
                    { model: userInfo }
                ]
            })
            .then((alldata) => { res.render('admin/MiscellaneousRole/miscellaneousUserDetails.ejs', { alldata, id, roleType, moment }) })
            .catch((err) => {
                console.log(err)
            })
    },

    showAddMiscellaneous: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        state.findAll({
            include: [{
                model: city
            }]
        }).then(statedata => {
            res.render("admin/MiscellaneousRole/createMiscellaneousRole.ejs", {
                message,
                error,
                statedata,
                formValue
            });
        })
    },

    createMiscellaneousRole: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        let images;
        const reqObj = {
            name: Joi.string().trim().max(50).required(),
            email: Joi.string().email().required(),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).required().alphanum(),
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
            gender: Joi.string().required()
                .messages({
                    'string.empty': `"Gender" cannot be an empty field`,
                    'any.required': `"Gender" is a required field`
                }),
            your_designation: Joi.string().required()
                .messages({
                    'string.empty': `"Designation" cannot be an empty field`,
                    'any.required': `"Designation" is a required field`
                }),
            referrer_code: Joi.string().optional(),
            pin_code: Joi.string().regex(/^[0-9]*$/).required()
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            state_id: Joi.string().required()
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().required()
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            password: Joi.string().required().min(6)
                .messages({
                    'string.min': `"Password" should have a minimum length of {#limit}`,
                }),
            confirm_password: Joi.any().valid(Joi.ref('password')).required()
                .messages({
                    'string.empty': `"Confirm Password" cannot be an empty field`,
                    'any.only': `'{{#label}} does not match`
                }),
            status: Joi.any().required()
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
            user_role_type: Joi.string().required().messages({ 'string.empty': `User role cannot be an empty field` }),
            dob: Joi.any().required().messages({ 'string.empty': `"Dob cannot be an empty field` }),
        }

        const schema = Joi.object(reqObj)
        const {
            error
        } = await schema.validate(reqParam)

        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
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
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Email address is already registered with us. Try with another Email !');
                    return res.redirect(req.header('Referer'))
                }
            }

            if (reqParam.mobile && reqParam.mobile !== '') {
                const user = await User.findOne({
                    where: {
                        mobile: reqParam.mobile,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((userMobileExistData) => userMobileExistData)

                if (user) {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Mobile is already registered with us. Try with another mobile no. !');
                    return res.redirect(req.header('Referer'))
                }
            }

            let checkReferrerCode = null
            if (reqParam.referrer_code && reqParam.referrer_code !== '') {
                checkReferrerCode = await User.findOne({
                    where: {
                        referrer_code: reqParam.referrer_code,
                        status: {
                            [Op.not]: DELETE,
                        },
                    },
                }).then((referrerCodeData) => referrerCodeData)

                if (!checkReferrerCode) {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Invalid refer code !');
                    return res.redirect(req.header('Referer'))
                }
            }

            try {
                let imageName;
                images = true;
                const extension = fields.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.image && (!imageExtArr.includes(extension))) {
                    // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    return res.redirect(req.header('Referer'))
                }
                imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                await Helper.ImageUpload(req, res, imageName)

                let passwordHash = await bcrypt.hashSync(reqParam.password, 10);

                // changes ---->
                // let referrer_code = Helper.generateReferrerCode(reqParam.mobile);
                // // return;
                const userObj = {
                    name: reqParam.name,
                    email: reqParam.email,
                    mobile: reqParam.mobile,
                    status: reqParam.status,
                    gender: reqParam.gender,
                    pin_code: reqParam.pin_code,
                    state_id: reqParam.state_id,
                    your_designation: reqParam.your_designation,
                    city_id: reqParam.city_id,
                    password: passwordHash,
                    image: imageName,
                    user_role_type: reqParam.user_role_type,
                    admin_approved: DISAPPROVED
                }
                const stateData = await state.findOne({
                    where: {
                        id: reqParam.state_id
                    }
                });

                await User.create(userObj)
                    .then(async(result) => {
                        if (result) {
                            const user_roles = UserRoles.create({
                                userId: result.id,
                                roleType: reqParam.user_role_type
                            });
                            const token = jwToken.issueUser({
                                id: result.id,
                                user_role_type: result.user_role_type,
                            })
                            result.reset_token = token
                            User.update({
                                reset_token: token,
                            }, {
                                where: {
                                    email: result.email
                                }
                            }).then(async(updateData) => {
                                // send mail to the added person
                                if (updateData) {
                                    req.flash('formValue', reqParam);
                                    req.flash('success', 'User created sucessfully !');
                                    console.log("req.header ::: , ", req.header);
                                    res.redirect(`/admin/create-form-basic-details/${result.id}`)
                                } else {
                                    req.flash('formValue', reqParam);
                                    req.flash('error', 'Something went wrong');
                                    res.redirect(req.header('Referer'))
                                }
                            })
                        }
                    }).catch((e) => {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'E-mail must be Unique');
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('370', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    showAddBasicDetails: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const user_id = req.params.id;

        state.findAll({
            include: [{
                model: city
            }]
        }).then(statedata => {
            res.render("admin/MiscellaneousRole/createBasicDetails.ejs", {
                message,
                error,
                statedata,
                formValue,
                user_id
            });
        })
    },

    createBasicDetail: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const authUserId = req.params.id;

        console.log(" :: data in fields :: ,reqParam :: ", reqParam);

        let images;
        const reqObj = {
            residence_no: Joi.string().trim().min(10).max(10).required(),
            office_no: Joi.string().trim().min(10).max(10).required(),
            whatsapp_no: Joi.string().trim().min(10).max(10).required(),
            pan_no: Joi.string().required(),
            adhar_no: Joi.string().required(),
            relative_relation: Joi.string().required(),
            realtive_name: Joi.string().required(),
            current_status: Joi.string().required(),
            residential_proof_name: Joi.any().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {

            console.log(" :: erorr :", error);

            let key = error.details[0].message.toUpperCase();

            console.log("  :error.details[0].context ::", error.details[0].context);

            req.flash('formValue', reqParam);
            req.flash('error', ' ', key);
            return res.redirect(req.header('Referer'))
        } else {
            try {
                let imgArray = [fields.adhar_img_front, fields.adhar_img_back, fields.pan_img_front, fields.pan_img_back, fields.residential_proof];
                let imgNameArr = [];
                let imageName;
                for (var image of imgArray) {
                    const extension = image.type;
                    const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                    if (image && (!imageExtArr.includes(extension))) {
                        return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    }
                    imageName = `${image.name.split(".")[0]}${moment().unix()}${path.extname(image.name)}`;
                    imgNameArr.push(imageName);
                    Helper.ImageUploadMultiple(image, res, imageName);
                }

                // return;
                const userInfoObj = {
                    residence_no: reqParam.residence_no,
                    office_no: reqParam.office_no,
                    whatsapp_no: reqParam.whatsapp_no,
                    pan_no: reqParam.pan_no,
                    adhar_no: reqParam.adhar_no,
                    relative_relation: reqParam.relative_relation,
                    realtive_name: reqParam.realtive_name,
                    current_status: reqParam.current_status,
                    residential_proof_name: reqParam.residential_proof_name,
                    adhar_img_front: imgNameArr[0],
                    adhar_img_back: imgNameArr[1],
                    pan_img_front: imgNameArr[2],
                    pan_img_back: imgNameArr[3],
                    residential_proof: imgNameArr[4],
                    user_id: authUserId
                }
                await userInfo.create(userInfoObj)
                    .then(async(result) => {
                        if (result) {
                            req.flash('formValue', reqParam);
                            req.flash('success', 'Basic info created sucessfully !');
                            console.log("req.header ::: , ", req.header);
                            res.redirect(`/admin/create-form-bussiness-correspondence/${authUserId}`)
                        }
                    }).catch((e) => {
                        req.flash('formValue', reqParam);
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('370', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    showAddBussinessCorrespondence: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];
        const user_id = req.params.id;

        state.findAll({
            include: [{
                model: city
            }]
        }).then(statedata => {
            res.render("admin/MiscellaneousRole/createBussiness.ejs", {
                message,
                error,
                statedata,
                formValue,
                user_id
            });
        })
    },

    createBussinessDetail: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const authUserId = req.params.id;

        console.log(" :: req, ", req.fields);

        let images;
        const reqObj = {
            current_bussiness: Joi.string().required(),
            bussiness_type: Joi.string().required(),
            bussiness_name: Joi.string().required(),
            house_name: Joi.string().required(),
            street_no_name: Joi.string().required(),
            ward: Joi.number().required(),
            municipality: Joi.string().required(),
            ref1_name: Joi.string().required(),
            ref1_occupation: Joi.string().required(),
            ref1_address: Joi.string().required(),
            ref1_mobile: Joi.string().trim().min(10).max(10).required(),
            ref2_name: Joi.string().optional(),
            ref2_occupation: Joi.string().optional(),
            ref2_address: Joi.string().optional(),
            ref2_mobile: Joi.string().trim().min(10).max(10).optional(),
            achievement1: Joi.string().optional(),
            achievement2: Joi.string().optional(),
            achievement3: Joi.string().optional(),
            no_towns: Joi.number().required(),
            name_towns: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            bussiness_years: Joi.string().required(),
            dimensions: Joi.string().required(),
            infrastructure_available: Joi.string().required(),
            current_income_pa: Joi.number().required(),
            no_customers: Joi.number().required(),
            popular: Joi.string().valid(YES, NO).required(),
            customers_served: Joi.number().optional(),
            pincode: Joi.number().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            let key = error.details[0].message.toUpperCase();
            req.flash('formValue', reqParam);
            req.flash('error', ' ', key);
            return res.redirect(req.header('Referer'))
        } else {
            try {
                let imageName;
                images = true;
                const extension = fields.bussiness_img.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.bussiness_img && (!imageExtArr.includes(extension))) {
                    return res.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                }
                fields.image = fields.bussiness_img;
                imageName = images ? `${fields.bussiness_img.name.split(".")[0]}${moment().unix()}${path.extname(fields.bussiness_img.name)}` : '';
                Helper.ImageUpload(req, res, imageName)

                // return;
                const userInfoObj = {
                    current_bussiness: reqParam.current_bussiness,
                    bussiness_type: reqParam.bussiness_type,
                    bussiness_name: reqParam.bussiness_name,
                    house_name: reqParam.house_name,
                    street_no_name: reqParam.street_no_name,
                    ward: reqParam.ward,
                    municipality: reqParam.municipality,
                    city_id: reqParam.city_id,
                    state_id: reqParam.state_id,
                    pincode: reqParam.pincode,
                    bussiness_years: reqParam.bussiness_years,
                    dimensions: reqParam.dimensions,
                    bussiness_img: imageName,
                    infrastructure_available: reqParam.infrastructure_available,
                    current_income_pa: reqParam.current_income_pa,
                    no_customers: reqParam.no_customers,
                    popular: reqParam.popular,
                    customers_served: reqParam.customers_served,
                    ref1_name: reqParam.ref1_name,
                    ref1_occupation: reqParam.ref1_occupation,
                    ref1_address: reqParam.ref1_address,
                    ref1_mobile: reqParam.ref1_mobile,
                    ref2_name: reqParam.ref2_name,
                    ref2_occupation: reqParam.ref2_occupation,
                    ref2_address: reqParam.ref2_address,
                    ref2_mobile: reqParam.ref2_address,
                    achievement1: reqParam.achievement1,
                    achievement2: reqParam.achievement2,
                    achievement3: reqParam.achievement3,
                    no_towns: reqParam.no_towns,
                    name_towns: reqParam.name_towns,
                    user_id: authUserId,
                }
                await currentBussiness.create(userInfoObj)
                    .then(async(result) => {
                        if (result) {
                            console.log("result :: ,", result);
                            req.flash('formValue', reqParam);
                            req.flash('success', 'Bussiness info added sucessfully !');
                            console.log("req.header ::: , ", req.header);
                            res.redirect('/admin/miscellaneous-roles');
                        }
                    }).catch((e) => {
                        console.log(" erorr ::: 474 ,", e);
                        req.flash('formValue', reqParam);
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log(" erorr ::: 479 ,", e);
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    deleteMiscellaneousUserDetails: async(req, res) => {
        const error = req.flash('error')
        const message = req.flash('success')
        const id = req.params.id
        User.update({ status: DELETE }, {
                where: {
                    id: id
                }
            })
            .then(async(data) => {
                req.flash("error", "Miscellaneous Role Deleted sucessfully !");
                res.redirect('/admin/miscellaneous-roles')
            })

        .catch((err) => {
            req.flash('error', 'Please check your network connection !');
            res.redirect(req.header('Referer'))
        })


    },

    showEditMiscellaneousUser: async(req, res) => {
        const id = req.params.id;
        const error = req.flash('error')
        const message = req.flash('success')
        const formValue = req.flash('formValue')[0];

        await User.findByPk(id, {
                include: [
                    { model: state },
                    { model: city },
                    { model: currentBussiness, include: [{ model: state }, { model: city }] },
                    { model: userInfo }
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
                        res.render("admin/MiscellaneousRole/editMiscellaneousRole.ejs", {
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
                req.flash('alldata', reqParam);
                req.flash("error", err);
                res.redirect(req.header('Referer'))
            });
    },

    editMiscellaneousUser: async(req, res) => {
        const id = req.params.id
        const fields = req.files;
        const reqParam = req.fields;

        let images;
        const schema = Joi.object({
            name: Joi.string().trim().max(50).optional().allow(''),
            email: Joi.string().email().optional().allow(''),
            mobile: Joi.string().trim().min(10).max(12).regex(/^[0-9]*$/).optional().allow('').alphanum(),
            image: Joi.any()
                .meta({
                    swaggerType: 'file'
                })
                .optional()
                .description('Image File'),
            gender: Joi.string().optional().allow(''),
            your_designation: Joi.string().optional().allow(''),
            dob: Joi.string().optional().allow(''),
            pin_code: Joi.string().regex(/^[0-9]*$/).optional().allow('')
                .messages({
                    'string.empty': `"Pin Code" cannot be an empty field`,
                    'any.required': `"Pin Code" is a required field`
                }).alphanum(),
            state_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"State" cannot be an empty field`,
                    'any.required': `"State" is a required field`
                }).alphanum(),
            city_id: Joi.string().optional().allow('')
                .messages({
                    'string.empty': `"City" cannot be an empty field`,
                    'any.required': `"City" is a required field`
                }).alphanum(),
            status: Joi.any().optional().allow('')
                .messages({
                    'string.empty': `"Status cannot be an empty field`,
                }),
            admin_approved: Joi.any().optional().allow('')
                .messages({
                    'string.empty': `"Admin approved cannot be an empty field`,
                }),
        })
        const {
            error
        } = await schema.validate(reqParam)
        if (error) {
            console.log(reqParam.gender);
            console.log(error);
            console.log(" form value error");
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            res.redirect(req.header('Referer'))
        } else {

            let imageName;
            if (fields.image) {
                console.log("entered into fields.image ", fields.image);
                User.findByPk(id)
                    .then(async(imgdata) => {
                        let img = imgdata.image
                            // if (img) {
                            // Helper.RemoveImage(res, img);
                            // }
                    })

                images = true;
                const extension = fields.image.type;
                const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                if (fields && fields.image && (!imageExtArr.includes(extension))) {
                    // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Image invalid');
                    res.redirect(req.header('Referer'))
                }
                imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                Helper.ImageUpload(req, res, imageName)
            }


            let userObj = {
                name: reqParam.name,
                email: reqParam.email,
                mobile: reqParam.mobile,
                dob: reqParam.dob ? reqParam.dob : null,
                your_designation: reqParam.your_designation ? reqParam.your_designation : null,
                status: reqParam.status,
                gender: reqParam.gender ? reqParam.gender : null,
                pin_code: reqParam.pin_code,
                state_id: reqParam.state_id,
                city_id: reqParam.city_id,
                image: imageName ? imageName : imgdata.image,
                admin_approved: reqParam.admin_approved
            }
            const userData = await User.findOne({
                where: {
                    id: id
                },
                include: [{
                    model: state,
                    attributes: ['id', 'code'],
                    id: {
                        [Op.eq]: ['state_id'],
                    },
                }, ]
            });

            if (reqParam.admin_approved == APPROVED) {
                userObj
                    = {...userObj,
                        referrer_code: await Helper.uniqueReferalCode(userData.state.code, userData.user_role_type, id)
                    };
            }
            await User.update(userObj, {
                    where: {
                        id: id
                    }
                })
                .then((data) => {

                    req.flash('success', 'User Updated sucessfully !');
                    res.redirect('/admin/miscellaneous-roles')
                })
                .catch((error) => {
                    console.log("::::::::::::::::::::::::::::error:::::::::::::::::::::::::::::::::::");
                    console.log(error);
                    req.flash('error', `${error}`);
                    res.redirect(req.header('Referer'))
                })
        }

    },

    editBasicDetailsUser: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const authUserId = req.params.id;
        console.log("reqParam.admin_approved");
        console.log(reqParam.admin_approved);
        console.log(" :: data in fields :: ,reqParam :: ", reqParam);
        let images;
        const reqObj = {
            residence_no: Joi.string().trim().min(10).max(10).required(),
            office_no: Joi.string().trim().min(10).max(10).required(),
            whatsapp_no: Joi.string().trim().min(10).max(10).required(),
            pan_no: Joi.string().required(),
            adhar_no: Joi.string().required(),
            achievement1: Joi.string().optional(),
            achievement2: Joi.string().optional(),
            achievement3: Joi.string().optional(),
            ref1_name: Joi.string().required(),
            ref1_occupation: Joi.string().required(),
            ref1_address: Joi.string().required(),
            ref1_mobile: Joi.string().trim().min(10).max(10).required(),
            ref2_name: Joi.string().optional(),
            ref2_occupation: Joi.string().optional(),
            ref2_address: Joi.string().optional(),
            ref2_mobile: Joi.string().trim().min(10).max(10).optional(),
            no_towns: Joi.number().required(),
            name_towns: Joi.string().required(),
            relative_relation: Joi.string().required(),
            realtive_name: Joi.string().required(),
            current_status: Joi.string().required(),
            residential_proof_name: Joi.any().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            let key = error.details[0].message.toUpperCase();
            req.flash('formValue', reqParam);
            req.flash('error', ' ', key);
            return res.redirect(req.header('Referer'))
        } else {
            try {
                // image upload for panCard, AdharCard ,ResidentialProof 
                // let imageName;
                // images = true;
                // const extension = fields.image.type;
                // const imageExtArr = ['image/jpg', 'application/octet-stream', 'image/jpeg', 'image/png'];
                // if (fields && fields.image && (!imageExtArr.includes(extension))) {
                //     // return Response.errorResponseData(res, res.__('Image invalid'), BAD_REQUEST);
                //     req.flash('formValue', reqParam);
                //     req.flash('error', 'Image invalid');
                //     return res.redirect(req.header('Referer'))
                // }
                // imageName = images ? `${fields.image.name.split(".")[0]}${moment().unix()}${path.extname(fields.image.name)}` : '';
                // await Helper.ImageUpload(req, res, imageName)


                // return;
                const userInfoObj = {
                    residence_no: reqParam.residence_no,
                    office_no: reqParam.office_no,
                    whatsapp_no: reqParam.whatsapp_no,
                    pan_no: reqParam.pan_no,
                    adhar_no: reqParam.adhar_no,
                    achievement1: reqParam.achievement1,
                    achievement2: reqParam.achievement2,
                    achievement3: reqParam.achievement3,
                    ref1_name: reqParam.ref1_name,
                    ref1_occupation: reqParam.ref1_occupation,
                    ref1_address: reqParam.ref1_address,
                    ref1_mobile: reqParam.ref1_mobile,
                    ref2_name: reqParam.ref2_name,
                    ref2_occupation: reqParam.ref2_occupation,
                    ref2_address: reqParam.ref2_address,
                    ref2_mobile: reqParam.ref2_address,
                    no_towns: reqParam.no_towns,
                    name_towns: reqParam.name_towns,
                    relative_relation: reqParam.relative_relation,
                    realtive_name: reqParam.realtive_name,
                    current_status: reqParam.current_status,
                    residential_proof_name: reqParam.residential_proof_name,

                }
                await userInfo.update(userInfoObj, {
                        where: {
                            user_id: authUserId
                        }
                    })
                    .then(async(result) => {
                        if (result) {
                            req.flash('formValue', reqParam);
                            req.flash('success', 'Basic Info Updated sucessfully !');
                            res.redirect('/admin/miscellaneous-roles')
                        }
                    }).catch((e) => {
                        req.flash('formValue', reqParam);
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                console.log('370', e)
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }

    },

    editBussinessDetails: async(req, res) => {
        const fields = req.files
        const reqParam = req.fields;
        const authUserId = req.params.id;

        let images;
        const reqObj = {
            current_bussiness: Joi.string().required(),
            bussiness_type: Joi.string().required(),
            bussiness_name: Joi.string().required(),
            address: Joi.string().required(),
            state_id: Joi.number().required(),
            city_id: Joi.number().required(),
            bussiness_years: Joi.string().required(),
            dimensions: Joi.string().required(),
            infrastructure_available: Joi.string().required(),
            current_income_pa: Joi.number().required(),
            no_customers: Joi.number().required(),
            popular: Joi.string().required(),
            customers_served: Joi.number().optional(),
            pincode: Joi.number().required(),
        }

        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)

        if (error) {
            let key = error.details[0].message.toUpperCase();
            req.flash('formValue', reqParam);
            req.flash('error', ' ', key);
            return res.redirect(req.header('Referer'))
        } else {
            try {


                const userInfoObj = {
                    current_bussiness: reqParam.current_bussiness,
                    bussiness_type: reqParam.bussiness_type,
                    bussiness_name: reqParam.bussiness_name,
                    address: reqParam.address,
                    city_id: reqParam.city_id,
                    state_id: reqParam.state_id,
                    pincode: reqParam.pincode,
                    bussiness_years: reqParam.bussiness_years,
                    dimensions: reqParam.dimensions,
                    // bussiness_img: reqParam.bussiness_img,
                    infrastructure_available: reqParam.infrastructure_available,
                    current_income_pa: reqParam.current_income_pa,
                    no_customers: reqParam.no_customers,
                    popular: reqParam.popular,
                    customers_served: reqParam.customers_served,
                    // user_id: authUserId,
                }
                await currentBussiness.update(userInfoObj, {
                        where: {
                            user_id: authUserId
                        }
                    })
                    .then(async(result) => {
                        if (result) {
                            console.log("result :: ,", result);
                            req.flash('formValue', reqParam);
                            req.flash('success', 'Bussiness info added sucessfully !');
                            console.log("req.header ::: , ", req.header);
                            res.redirect('/admin/miscellaneous-roles');
                        }
                    }).catch((e) => {
                        req.flash('formValue', reqParam);
                        res.redirect(req.header('Referer'))
                    })
            } catch (e) {
                req.flash('formValue', reqParam);
                req.flash('error', 'Something went wrong');
                res.redirect(req.header('Referer'))
            }
        }
    },

    showMiscellaneousRolesReferenceTable: async(req, res) => {

        console.log(" :: into the con troller ::");

        const error = req.flash('error')
        const message = req.flash('success')

        const authUserId = req.params.id;

        let query = {
            ref_user_id: authUserId
        }

        let arr = [{
            model: User,
            required: true,
            as: 'registered_user',
        }, ]

        let options = {
            where: query,
            order: [
                ['id', 'DESC']
            ],
            include: arr,
            attributes: [],
            group: ["registered_user.user_role_type"]
        }

        // registrees_currently_on_subscription , new_registrees_added_last_month
        options.attributes.push(
            [
                Sequelize.literal(`(
                    SELECT COUNT(DISTINCT(user_id))
                    FROM subscribed_users AS subscribed
                    WHERE
                    subscribed.user_id = UserReferral.user_id
                    AND 
                    UserReferral.ref_user_id = ${authUserId}
                )`),
                'registrees_currently_on_subscription'
            ], [
                Sequelize.literal(`(
                    SELECT date_add(registered_user.createdAt,INTERVAL 30 day) > now()  GROUP BY registered_user.user_role_type
                )`),
                'new_registrees_added_last_month'
            ]
        )

        // total commission
        let total_commission = await WalletTransactions.sum('amount', {
            where: {
                user_id: authUserId,
                reason: "Commission",
            }
        })

        // newCommission, 
        let newCommission = await WalletTransactions.findOne({
            where: {
                user_id: authUserId,
                reason: "Commission",

            },
            order: [
                ['id', 'DESC']
            ],
            attributes: [
                ["amount", "my_new_commission"]
            ]
        })

        // total_number_registrees
        let total_number_registrees = await UserReferral.count({
            where: {
                ref_user_id: authUserId,
            }
        })

        // total_Bussiness_correspondence
        let total_bussiness_correspondence = await UserReferral.count({
            where: {
                ref_user_id: authUserId,
            },
            include: [{
                model: User,
                required: true,
                as: 'registered_user',
                where: {
                    user_role_type: USER_ROLE_TYPE.business_correspondence
                }
            }]
        })

        await UserReferral.count(options)
            .then((data) => {

                console.log(" :: data :: ", data);

                data = {
                    data,
                    total_commission,
                    total_number_registrees,
                    total_bussiness_correspondence,
                    newCommission: newCommission ? newCommission.dataValues.my_new_commission : '',
                    user_id: authUserId
                }

                if (data.data.length > 0) {
                    console.log(" :: if :: ");
                    // return res.send({data})
                    return res.render("admin/MiscellaneousRole/showReferenceTable.ejs", {
                        message,
                        error,
                        data,
                    });
                } else {
                    console.log(" :: else :: ");
                    return res.render("admin/MiscellaneousRole/showReferenceTable.ejs", {
                        message,
                        error: 'No data found !',
                        data,
                    });
                }
            }, (e) => {
                console.log("error::", e);
                req.flash('formValue');
                req.flash('error', 'Something Went Wrong');
                res.redirect(req.header('Referer'))
            })
            .catch(err => console.log("errr ::: ", err))
    },


    showMiscellaneousRolesCreatedUser: async(req, res) => {

        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 5;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit


        const error = req.flash('error')
        const message = req.flash('success')

        let search = req.query.search;
        const authUserId = req.params.id;
        let ref_user_id = authUserId;



        let arr = [{
                model: User,
                as: 'registered_user',
                where: {},
                attributes: ["name", "id", "user_role_type", "email", "status"]
            },
            {
                model: User,
                as: 'registered_by',
                where: {},
                attributes: ["name", "id", "user_role_type", "email", "status"]
            }

        ]

        let SearchVal;
        search ? arr[0]['where']['name'] = {
            [Op.like]: `%${search}%`
        } : '';
        search ? SearchVal = search : SearchVal = '';

        let options = {
            where: {
                ref_user_id: authUserId,
            },
            include: arr,
            attributes: ["id", ["createdAt", "date_registered"]],
            limit: limit,
            offset: offset
        }

        await UserReferral.findAndCountAll(options)
            .then((data) => {
                const extra = {
                    per_page: limit,
                    total: data.count,
                    pages: Math.ceil(data.count / limit),
                    pageNo: pageNo,
                    limit
                }

                if (data.rows.length > 0) {
                    return res.render("admin/MiscellaneousRole/showRegisteredUsers.ejs", {
                        message,
                        error,
                        data,
                        SearchVal,
                        user_id: authUserId,
                        extra
                    });
                } else {
                    return res.render("admin/MiscellaneousRole/showRegisteredUsers.ejs", {
                        message,
                        error: 'No data found !',
                        data,
                        SearchVal,
                        user_id: authUserId,
                        extra
                    });


                }
            }, (e) => {
                console.log("error::", e);
                req.flash('formValue', reqParam);
                req.flash('error', 'Something Went Wrong');
                res.redirect(req.header('Referer'))
            })
            .catch(err => console.log("errr ::: ", err))

    },


    showMiscellaneousRolesCommissionDetails: async(req, res) => {

        const id = req.params.id;

        const error = req.flash('error')
        const message = req.flash('success')

        let query = {
            user_id: req.params.id,
            reason: "Commission",
        }

        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 10;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit

        let options = {
            where: query,
            limit: limit,
            offset: offset,
            attributes: ["id", ["details", "Reason"],
                ["createdAt", "date"],
                ["amount", "my_commission_amount"]
            ]
        }

        if (limit) options["limit"] = limit;

        WalletTransactions.findAndCountAll(options)
            .then((data) => {
                const extra = {
                    per_page: limit,
                    total: data.count,
                    pages: Math.ceil(data.count / limit),
                    pageNo: pageNo,
                    limit
                }

                // return res.send({
                //     message,
                //     error,
                //     data,
                //     user_id : req.params.id,
                //     extra
                // })

                if (data.rows.length > 0) {
                    return res.render("admin/MiscellaneousRole/commissioDetails.ejs", {
                        message,
                        error,
                        data,
                        user_id: req.params.id,
                        extra
                    });
                } else {
                    return res.render("admin/MiscellaneousRole/commissioDetails.ejs", {
                        message,
                        error: 'No data found !',
                        data,
                        user_id: req.params.id,
                        extra
                    });
                }
            })
            .catch((e) => {
                console.log("error::", e);
                req.flash('formValue', reqParam);
                req.flash('error', 'Something Went Wrong');
                res.redirect(req.header('Referer'))
            })

    },
    showBusinessPartnerCommissionDetails: async(req, res) => {


        const error = req.flash('error')
        const message = req.flash('success')

        let query = {
            user_id: req.params.id,
            reason: "Commission",
        }

        let page = parseInt(req.query.page) || 1
        let limit = null;
        if (page) limit = 10;

        const pageNo = page && page > 0 ? parseInt(page, 10) : 1
        const offset = (pageNo - 1) * limit

        let options = {
            where: query,
            limit: limit,
            offset: offset,
            include: [{ model: currentBussiness, required: true }, { model: WalletTransactions }],
            where: { user_role_type: [USER_ROLE_TYPE.business_correspondence, USER_ROLE_TYPE.cluster_manager, ] },
            attributes: ["id", "name", "user_role_type", [
                    Sequelize.literal(`(
                        SELECT COUNT(id)
                        FROM user_referral
                        where user_referral.user_id=User.id
                    )`),
                    'total_registrees'
                ],
                [
                    Sequelize.literal(`(
                SELECT COUNT(DISTINCT(user_referral.user_id))
                FROM subscribed_users
                inner join user_referral on user_referral.user_id = subscribed_users.user_id
                where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "JS"
            )`),
                    'registrees_js_currently_on_subscription'
                ],
                [
                    Sequelize.literal(`(
                SELECT COUNT(DISTINCT(user_referral.user_id))
                FROM subscribed_users
                inner join user_referral on user_referral.user_id = subscribed_users.user_id
                where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "HSP"
            )`),
                    'registrees_hsp_currently_on_subscription'
                ],

                [
                    Sequelize.literal(`(
                SELECT COUNT(DISTINCT(user_referral.user_id))
                FROM subscribed_users
                inner join user_referral on user_referral.user_id = subscribed_users.user_id
                where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "HSS"
            )`),
                    'registrees_hss_currently_on_subscription'
                ],

                [
                    Sequelize.literal(`(
                SELECT COUNT(DISTINCT(user_referral.user_id))
                FROM subscribed_users
                inner join user_referral on user_referral.user_id = subscribed_users.user_id
                where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "LH"
            )`),
                    'registrees_lh_currently_on_subscription'
                ],

                [
                    Sequelize.literal(`(
                SELECT COUNT(DISTINCT(user_referral.user_id))
                FROM subscribed_users
                inner join user_referral on user_referral.user_id = subscribed_users.user_id
                where user_referral.ref_user_id = User.id and (SELECT roleType FROM user_roles WHERE user_roles.userId = subscribed_users.user_id ORDER BY user_roles.createdAt ASC limit 1) = "COMPANY"
            )`),
                    'registrees_company_currently_on_subscription'
                ],



            ]

        }

        if (limit) options["limit"] = limit;
        User.findAndCountAll(options)
            .then((data) => {
                console.log("test chetan start");
                console.log(data.rows[0].id);
                console.log(data.rows[0].dataValues.registrees_js_currently_on_subscription);
                console.log("test chetan end");
                const extra = {
                    per_page: limit,
                    total: data.count,
                    pages: Math.ceil(data.count / limit),
                    pageNo: pageNo,
                    limit
                }

                if (data.rows.length > 0) {
                    return res.render("admin/MiscellaneousRole/business_partner_commission_details.ejs", {
                        message,
                        error,
                        data,
                        user_id: req.params.id,
                        extra
                    });
                } else {
                    return res.render("admin/MiscellaneousRole/business_partner_commission_details.ejs", {
                        message,
                        error: 'No data found !',
                        data,
                        user_id: req.params.id,
                        extra
                    });
                }
            })
            .catch((e) => {
                console.log("error::", e);
                req.flash('error', 'Something Went Wrong');
                res.redirect(req.header('Referer'))
            })

    }
}