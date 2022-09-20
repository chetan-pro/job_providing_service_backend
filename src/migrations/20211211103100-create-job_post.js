module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface
          .createTable('job_post', {
              id: {
                  allowNull: false,
                  autoIncrement: true,
                  primaryKey: true,
                  type: Sequelize.INTEGER,
              },
              name: {
                  allowNull: false,
                  type: Sequelize.STRING(50),
              },
              job_role_type_id : {
                  type: Sequelize.INTEGER,
                  allowNull: false
              },
              job_title: {
                  type: Sequelize.STRING(200),
              },
              industry_id : {
                  type: Sequelize.INTEGER,
                  allowNull: false,
              },
              sector_id: {
                  type: Sequelize.INTEGER,
                  allowNull: false,
              },
              employment_type: {
                  type: Sequelize.STRING,
                  comment: 'full_time:FULL_TIME, part_time:PART_TIME, intern:INTERNSHIP,both:BOTH',
              },
              contract_type: {
                  type: Sequelize.STRING,
                  comment: 'contracted:CONTRACTED, intern:INTERNSHIP,fresher:FRESHER,other:OTHER',
              },
              contract_duration: {
                  type: Sequelize.INTEGER,
                  allowNull: true,
                  defaultValue: null,
              },
              boosting_state_id:{
                type: Sequelize.INTEGER,
                allowNull: true,
              },
              contract_other_type: {
                  type: Sequelize.STRING,
                  allowNull: true,
                  defaultValue: null
              },
              job_schedule: {
                  allowNull: false,
                  type: Sequelize.STRING,
                  comment: 'morning_shift:MORNING_SHIFT, night_shift:NIGHT_SHIFT, flexible:FLEXIBLE_SHIFT,monday_to_friday:MONDAY_TO_FRIDAY,weekend:WEEKEND,other:OTHER',
              },
              job_timetable:{
                  type: Sequelize.STRING(100),
                  comment:'10am to 7pm:MORNING_TIME, 12am to 9pm:AFTERNOON_TIME,5pm to 2am:EVENING_TIME,7pm to 4am:NIGHT_TIME',
              },

              job_time_from :{
                type: Sequelize.STRING(100),
            },
    
            job_time_to :{
                type: Sequelize.STRING(100),
            },
            job_type_id:{
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue : 1
            },
            state_id:{
                type: Sequelize.INTEGER,
            },
            city_id:{
                type: Sequelize.INTEGER,
            },
            pin_code: {
                allowNull: true,
                type: Sequelize.TEXT,
                defaultValue: null
            },
            number_of_position: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            work_from_home: {
                type: Sequelize.STRING,
                comment: 'Y:YES, N:NO, TEMP:TEMPORARY',
            },
            job_description: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null
            },
            salary_type: {
                type: Sequelize.STRING(200),
                allowNull: false,
                comment: 'amount_in_range:AMOUNT_IN_RANGE,fixed_amount:FIXED_AMOUNT,upto_amount:UPTO_AMOUNT'
            },
            paid_type: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'PA:ANNUAL,PH:HOUR'
            },
            salary: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            salary_from: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            salary_to: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            user_id:{
               type: Sequelize.INTEGER,
                allowNull:false
            },

            subscription_plan_id :{
                type: Sequelize.INTEGER,
                allowNull:false                   
            },

            experience_required: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Y:YES,N:NO'
            },
            education_id:{
                type: Sequelize.INTEGER,
                allowNull: true
            },
            exp_from:{
                type: Sequelize.INTEGER,
                allowNull:true
            },
            exp_to:{
                type: Sequelize.INTEGER,
                allowNull:true
            },
            exp_from_type:{
                type: Sequelize.STRING,
                allowNull:true,
                comment:'Y:YEAR,M:MONTH'
            },
            exp_to_type:{
                type: Sequelize.STRING,
                allowNull:true,
                comment:'Y:YEAR,M:MONTH'
            },
            education_required:{
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Y:YES,N:NO'
            },
            job_status:{
                type: Sequelize.STRING,
                defaultValue:'OPEN',
                comment: 'OPEN:OPEN,CLOSE:CLOSE'
            },
            submit_resume: {
                type: Sequelize.STRING,
                comment: 'Y:YES,N:NO,Option:OPTIONAL'
            },
            email: {
                type: Sequelize.STRING(200),
            },

            deadline:{
                type: Sequelize.DATE,
                allowNull: true,
            },
    
            organization :{
                type: Sequelize.STRING,
                allowNull:true,
            },
    
            advertise_link:{
                type: Sequelize.TEXT,
                allowNull: true,
            },
    
            official_website :{
                type: Sequelize.TEXT,
                allowNull: true,
            },
    
            image :{
                type: Sequelize.TEXT,
                allowNull: true,
            },


            status: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
                comment: '0:inactive,1:active,2:delete',
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
  down: async (queryInterface) => {
    await queryInterface.dropTable('job_post')
  },
}

