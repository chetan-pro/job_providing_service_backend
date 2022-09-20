const {
    Op,
    where,
    Sequelize
} = require("sequelize");
const Joi = require("@hapi/joi");
const { StaticData } = require("../../models");
const path = require("path");
const {} = require('../../services/Constants');
const moment = require("moment");
const Helper = require('../../services/Helper')

module.exports = {
    getStaticData: async(req, res) => {
        await StaticData.findAll().then((data) => {
            console.log("::::::::::::::data::::::::::::::::::::");
            console.log(data);
            console.log("::::::::::::::meta::::::::::::::::::::");
            return res.render('admin/staticData/staticData', {
                error: '',
                message: '',
                data
            })
        });

    },
    previewHtml: async(req, res) => {
        await StaticData.findOne({ where: { key: req.params.key } }).then((data) => {
            console.log(data.label);
            return res.render('admin/staticData/previewPrivacyPolicy', {
                error: '',
                message: '',
                label: data.label,
                data: data.html_data
            });
        });

    },
    addHtml: async(req, res) => {
        await StaticData.findOne({ where: { key: req.params.key } }).then((data) => {
            console.log(data.label);
            return res.render('admin/staticData/addPrivacyPolicy', {
                error: '',
                message: '',
                label: data.label,
                key: data.key,
                html_data: data.html_data
            });
        });

    },
    editHtml: async(req, res) => {
        await StaticData.update({ html_data: req.body.editor }, {
            where: {
                key: req.params.key
            }
        }).then((data) => {
            return res.redirect('/admin/static-data');
        });

    }
}