const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.state, {
                sourceKey: 'state_id',
                foreignKey: 'id',
            })
            User.belongsToMany(models.Permissons, {
                through: 'user_permissions',
                foreignKey: 'userId'
            })
            User.hasOne(models.city, {
                sourceKey: 'city_id',
                foreignKey: 'id',
            })
            User.hasOne(models.Industry, {
                sourceKey: 'industry_id',
                foreignKey: 'id',
            })
            User.belongsTo(models.Role, {
                sourceKey: 'role_type',
                foreignKey: 'user_role_type',
            })
            User.hasMany(models.UserReferral, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserReferral, {
                sourceKey: 'id',
                foreignKey: 'ref_user_id',
            })
            User.hasMany(models.SubscribedUser, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserLanguage, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.Education, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.Certification, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserSkill, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.CustomAlert, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserSavedJobs, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserLikedJobs, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.UserAppliedJob, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.WalletTransactions, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.NotInterested, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.WorkExperience, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })
            User.hasMany(models.serviceProviderBranch, {
                sourceKey: 'id',
                foreignKey: 'service_provider_id',
            })
            User.hasMany(models.service, {
                sourceKey: 'id',
                foreignKey: 'service_provider_id',
            })

            User.belongsToMany(models.Role, {
                through: 'user_roles',
                foreignKey: 'userId',
                as: 'role_type'
            })

            User.hasMany(models.serviceRequest, {
                sourceKey: 'id',
                foreignKey: 'user_id'
            })

            User.hasMany(models.rateServiceRequest, {
                sourceKey: 'id',
                foreignKey: "user_id"
            })

            User.hasMany(models.UserRoles, {
                sourceKey: 'id',
                foreignKey: "userId"
            })

            User.hasMany(models.Answers, {
                sourceKey: 'id',
                foreignKey: 'user_id'
            })

            User.hasOne(models.ServiceProviderDocument, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })

            // added relation with viewJob
            User.belongsToMany(models.JobPost, {
                through: 'user_view_jobs',
                foreignKey: 'user_id',
                as: 'userViewJob'
            })

            //added relation with LocalHunarVideos
            User.hasMany(models.LocalHunarVideos, {
                sourceKey: 'id',
                foreignKey: 'user_id'
            })

            User.hasMany(models.Notification, {
                sourceKey: 'id',
                foreignKey: 'user_id'
            })

            User.hasOne(models.currentBussiness, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })

            User.hasOne(models.userInfo, {
                sourceKey: 'id',
                foreignKey: 'user_id',
            })

            User.hasMany(models.ResumeAccessData, {
                foreignKey: 'user_id',
                sourceKey: 'id'
            })
        }
    }
    User.init({
        name: DataTypes.STRING(50),
        company_id: DataTypes.INTEGER,
        email: {
            type: DataTypes.STRING(200),
            unique: true,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        gender: {
            type: DataTypes.STRING,
            comment: 'male:MALE,female:FEMALE,other:OTHER',
            allowNull: true,
        },
        dob: {
            type: DataTypes.DATE,
            format: 'DD-MM-YYYY',
            defaultValue: null,
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resume: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        company_link: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        company_description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        about_us: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        address_line1: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        address_line2: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        your_full_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        your_designation: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        pin_code: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        mobile: DataTypes.STRING(15),
        reset_token: {
            type: DataTypes.TEXT(200),
            defaultValue: '',
        },
        reset_expiry: {
            type: DataTypes.DATE,
            defaultValue: null,
        },
        otp: {
            type: DataTypes.INTEGER,
            defaultValue: null,
        },
        state_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'state',
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
        industry_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Industry',
                key: 'id',
            },
        },
        user_role_type: {
            type: DataTypes.STRING,
            references: {
                model: 'Role',
                key: 'role_type',
            },
        },
        referrer_code: DataTypes.STRING,
        social_login_type: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '1-Email, 2-Facebook, 3-Google',
        },
        social_login_id: {
            allowNull: true,
            type: DataTypes.TEXT,
        },
        is_user_available: {
            type: DataTypes.STRING,
            defaultValue: 'N',
            comment: 'Y:YES,N:NO',
        },
        fcm_token: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        wallet_money: {
            type: DataTypes.TEXT,
            defaultValue: 0
        },
        share_link: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '0-inactive, 1-active, 2-deleted ,4-un_verify',
        },
        admin_approved: {
            type: DataTypes.STRING,
            defaultValue: 1,
            comment: '0-disapprove, 1-approve,',
        },
        is_staff_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        linkedIn_id: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        timestamps: true,
        modelName: 'User',
        tableName: 'user',
        indexes: [{
                unique: true,
                fields: ['email', 'referrer_code'],
            },
            {
                unique: false,
                fields: ['state_id', 'city_id'],
            },
        ]
    })
    return User
}