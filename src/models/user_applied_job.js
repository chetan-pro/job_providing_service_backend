'use strict';
const {
    Model
} = require('sequelize');
// const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
    class UserAppliedJob extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            UserAppliedJob.hasOne(models.JobPost, {
                sourceKey: 'job_post_id',
                foreignKey: 'id',
            })
            UserAppliedJob.hasOne(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id',
            })

            UserAppliedJob.hasOne(models.User, {
                sourceKey: 'hired_staff_id',
                as : 'staff_id',
                foreignKey: 'id',
            })

            UserAppliedJob.hasOne(models.User, {
                sourceKey: 'hired_staff_id',
                as : 'hiredStaff',
                foreignKey: 'id',
            })
        }
    }
    UserAppliedJob.init({
        job_post_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'JobPost',
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id',
            },
        },
        hired_staff_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'User',
                key: 'id',
            },
        },
        reason:{
            type : DataTypes.TEXT,
            allowNull : true,
        },
        company_status: {
            type: DataTypes.STRING,
            comment: 'PENDING:PENDING,SHORTLISTED:shortlisted,SEND OFFER:SEND_OFFER,REJECT:REJECTED',
        },
        candidate_status: {
            type: DataTypes.STRING,
            comment: 'APPLY_JOB:APPLY_JOB,REJECT_OFFER:REJECT_OFFER,ACCEPT_OFFER:ACCEPT_OFFER',
        },
        is_company_selected:{
            type: DataTypes.STRING,
            allowNull : true,
            comment: 'SEND_OFFER:SEND_OFFER',
        },
        separate_resume: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        offer_letter: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '0:inactive,1:active,2:delete',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'UserAppliedJob',
        tableName: 'user_applied_jobs'
    });
    return UserAppliedJob;
};