module.exports = {
    up: async(queryInterface, Sequelize) => {
        await queryInterface
            .createTable('user', {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },
                user_id: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                name: {
                    allowNull: true,
                    type: Sequelize.STRING(50),
                },
                company_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                industry_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                user_role_type: {
                    type: Sequelize.STRING,
                },
                email: {
                    type: Sequelize.STRING(200),
                    unique: true,
                },
                gender: {
                    type: Sequelize.STRING,
                    comment: 'male:MALE,female:FEMALE,other:OTHER',
                },
                dob: {
                    type: Sequelize.DATE,
                    format: 'DD-MM-YYYY',
                    defaultValue: null,
                },
                password: {
                    allowNull: true,
                    type: Sequelize.STRING(100),
                },
                mobile: {
                    allowNull: true,
                    type: Sequelize.STRING(15),
                },
                pin_code: {
                    allowNull: true,
                    type: Sequelize.TEXT,
                    defaultValue: null
                },
                state_id: {
                    type: Sequelize.INTEGER,
                },
                city_id: {
                    type: Sequelize.INTEGER,
                },
                referrer_code: {
                    type: Sequelize.STRING(50),
                    unique: true,
                    allowNull: true,
                },
                otp: {
                    allowNull: true,
                    type: Sequelize.INTEGER,
                    defaultValue: null,
                },
                reset_token: {
                    defaultValue: '',
                    type: Sequelize.TEXT,
                },
                reset_expiry: {
                    defaultValue: null,
                    type: Sequelize.DATE,
                },
                social_login_type: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1,
                    comment: '1-Email, 2-Facebook, 3-Google',
                },
                social_login_id: {
                    allowNull: true,
                    type: Sequelize.TEXT,
                },
                image: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                resume: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                company_link: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                company_description: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                about_us: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                address_line1: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                address_line2: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                your_full_name: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                your_designation: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                linkedIn_id: {
                    allowNull: true,
                    type: Sequelize.TEXT
                },
                is_user_available: {
                    type: Sequelize.STRING,
                    defaultValue: 'N',
                    comment: 'Y:YES,N:NO',
                },
                fcm_token: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                wallet_money: {
                    type: Sequelize.TEXT,
                    defaultValue: 0
                },
                share_link: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                status: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1,
                    comment: '0:inactive,1:active,2:delete,4:un_verify',
                },

                admin_approved: {
                    type: Sequelize.String,
                    defaultValue: 1,
                    comment: '0-disapprove, 1-approve,',
                },

                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
            })
    },
    down: async(queryInterface) => {
        await queryInterface.dropTable('user')
    },
}