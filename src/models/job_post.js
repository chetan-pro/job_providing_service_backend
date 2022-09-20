const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class JobPost extends Model {
        static associate(models) {
            
            JobPost.hasMany(models.Question, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })
            JobPost.hasOne(models.Industry, {
                sourceKey: 'industry_id',
                foreignKey: 'id',
            })
            JobPost.hasOne(models.Sector, {
                sourceKey: 'sector_id',
                foreignKey: 'id',
            })
            JobPost.hasOne(models.User, {
                sourceKey: 'user_id',
                foreignKey: 'id',
            })
            JobPost.hasMany(models.JobPostSkill, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })
            JobPost.hasOne(models.EducationData, {
                sourceKey: 'education_id',
                foreignKey: 'id',
            })
            JobPost.hasOne(models.state, {
                sourceKey: 'state_id',
                foreignKey: 'id',
            })

            JobPost.hasOne(models.state, {
                sourceKey: 'boosting_state_id',
                foreignKey: 'id',
                as : 'boosting_job_state_data'
            })

            JobPost.hasOne(models.city, {
                sourceKey: 'city_id',
                foreignKey: 'id',
            })
            JobPost.hasOne(models.JobType, {
                sourceKey: 'job_type_id',
                foreignKey: 'id',
            })
            JobPost.hasMany(models.UserSavedJobs, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })
            JobPost.hasOne(models.UserLikedJobs, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })
            JobPost.hasMany(models.UserAppliedJob, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })
            JobPost.hasOne(models.JobRoleType, {
                sourceKey: 'job_role_type_id',
                foreignKey: 'id',
            })
            JobPost.hasOne(models.NotInterested, {
                sourceKey: 'id',
                foreignKey: 'job_post_id',
            })

            // added relation with viewJob
            JobPost.belongsToMany(models.User,{
                through:'user_view_jobs',
                foreignKey:'job_post_id',
                as:'JobPostView'
            })

            JobPost.hasOne(models.SubscribedUser,{
                sourceKey : 'subscription_plan_id',
                foreignKey : 'id',
            })

        }
    }
    JobPost.init({
        name: {
            allowNull: false,
            type: DataTypes.STRING(50),
        },
        job_role_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'JobRoleType',
                key: 'id',
            },
        },
        job_title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        industry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Industry',
                key: 'id',
            },
        },
        sector_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Sector',
                key: 'id',
            },
        },
        job_timetable: {
            type: DataTypes.STRING(100),
            comment: '10am to 7pm:MORNING_TIME, 12am to 9pm:AFTERNOON_TIME,5pm to 2am:EVENING_TIME,7pm to 4am:NIGHT_TIME',
        },

        job_time_from :{
            type: DataTypes.STRING(100),
        },

        job_time_to :{
            type: DataTypes.STRING(100),
        },

        job_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue : 1
        },
        experience_required: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Y:YES,N:NO'
        },
        exp_from: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        exp_to: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        subscription_plan_id:{
            type: DataTypes.INTEGER,
            allowNull: true
        },
        exp_from_type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Y:YEAR,M:MONTH'
        },
        exp_to_type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Y:YEAR,M:MONTH'
        },
        education_required: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Y:YES,N:NO'
        },
        boosting_state_id :{
            type: DataTypes.INTEGER,
            allowNull: true
        },  
        education_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'EducationData',
                key: 'id',
            },
        },
        city_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'city',
                key: 'id',
            },
        },
        state_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'state',
                key: 'id',
            },
        },
        pin_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        number_of_position: {
            allowNull: true,
            type: DataTypes.INTEGER,
        },
        work_from_home: {
            type: DataTypes.STRING,
            comment: 'Y:YES, N:NO, TEMP:TEMPORARY',
        },
        employment_type: {
            type: DataTypes.STRING,
            comment: 'full_time:FULL_TIME, part_time:PART_TIME, intern:INTERNSHIP,both:BOTH',
        },
        contract_type: {
            type: DataTypes.STRING,
            comment: 'contracted:CONTRACTED, intern:INTERNSHIP,fresher:FRESHER,other:OTHER',
        },
        contract_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        contract_other_type: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        job_schedule: {
            allowNull: false,
            type: DataTypes.STRING,
            comment: 'morning_shift:MORNING_SHIFT, night_shift:NIGHT_SHIFT, flexible:FLEXIBLE_SHIFT,monday_to_friday:MONDAY_TO_FRIDAY,weekend:WEEKEND,other:OTHER',
        },
        salary_type: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'amount_in_range:AMOUNT_IN_RANGE,fixed_amount:FIXED_AMOUNT,upto_amount:UPTO_AMOUNT'
        },
        salary: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        paid_type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'PA:ANNUAL,PH:HOUR'
        },
        salary_from: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        salary_to: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        submit_resume: {
            type: DataTypes.STRING,
            comment: 'Y:YES,N:NO,Option:OPTIONAL'
        },
        email: {
            type: DataTypes.STRING,
        },
        job_status:{
            type: DataTypes.STRING,
            defaultValue:'OPEN',
            comment: 'OPEN:OPEN,CLOSE:CLOSE'
        },
        job_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id',
            },
        },

        deadline:{
            type: DataTypes.DATE,
            allowNull: true,
        },

        organization :{
            type: DataTypes.STRING,
            allowNull:true,
        },

        advertise_link:{
            type: DataTypes.TEXT,
            allowNull: true,
        },

        official_website :{
            type: DataTypes.TEXT,
            allowNull: true,
        },

        image :{
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '0:inactive,1:active,2:delete',
        },
    }, {
        sequelize,
        timestamps: true,
        modelName: 'JobPost',
        tableName: 'job_post',
        indexes: [{
            unique: false,
            fields: ['user_id', 'status'],
        }, ],
    })

    return JobPost
}