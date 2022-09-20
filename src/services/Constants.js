module.exports = {
    YES: 'Y',
    NO: 'N',
    DONE: 'done',
    SUCCESSED: 'success',
    FAILED: 'failed',
    CANCEL: 'cancel',
    ANNUAL: 'PA',
    MONTHLY: 'PM',
    HOUR: 'PH',
    YEAR: 'year',
    MONTH: 'M',
    DAYS: 'D',
    Email: 1,
    Facebook: 2,
    Google: 3,
    REQUEST: 'Requested',
    SUPER_ADMIN: 1,
    SUB_ADMIN: 2,
    SIGN_UP_REDIRECTION: 10,
    SUCCESS: 200,
    FAIL: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAGE_NOT_FOUND: 404,
    NOT_ACCEPTABLE: 406,
    ACTIVE: 1,
    UN_VERIFY: 4,
    INACTIVE: 0,
    APPROVED: 1,
    DISAPPROVED: 0,
    DELETE: 2,
    INTERNAL_SERVER: 500,
    PER_PAGE: 10,
    DEFAULT_PAGE: 1,
    NOT_VERIFIED: 0,
    VERIFIED: 1,
    WALLET_ADD_BY_ADMIN: 1,
    WALLET_REMOVE_BY_ADMIN: 2,
    WALLET_PURCHASE: 3,
    WALLET_REFFER: 4,
    WALLET_ORDER_REFFER: 5,
    PENDING: 'PENDING',
    ACCEPT: 'ACCEPTED',
    REJECT: 'REJECTED',
    SHORTLISTED: 'SHORTLISTED',
    SEND_OFFER: 'SEND_OFFER',
    APPLY_JOB: 'APPLY_JOB',
    REJECT_OFFER: 'REJECT_OFFER',
    ACCEPT_OFFER: 'ACCEPT_OFFER',
    AVAILABLE: 1,
    NOT_AVAILABLE: 0,
    BOTH: 'both',
    CONTRACTED: 'contracted',
    FRESHER: 'fresher',
    OTHER: 'other',
    MALE: 'male',
    FEMALE: 'female',
    MORNING_SHIFT: 'morning_shift',
    NIGHT_SHIFT: 'night_shift',
    FLEXIBLE_SHIFT: 'flexible',
    MONDAY_TO_FRIDAY: 'monday_to_friday',
    WEEKEND: 'weekend',
    TEMPORARY: 'TEMP',
    OPTIONAL: 'Option',
    AMOUNT_IN_RANGE: 'amount_in_range',
    FIXED_AMOUNT: 'fixed_amount',
    UPTO_AMOUNT: 'upto_amount',
    PRIVATE_JOB: 'private',
    GOVT_JOB: 'government',
    WALLET_TYPE: {
        credit: 'credit',
        debit: 'Debit'
    },
    PAYMENT_TYPE: {
        razorpay: 'E',
        wallet: 'W',
        both: 'EW',
    },
    USER_ROLE_TYPE: {
        candidate: 'JS',
        company: 'COMPANY',
        company_staff: 'CS',
        home_service_provider: 'HSP',
        home_service_seeker: 'HSS',
        local_hunar: 'LH',
        business_correspondence: 'BC',
        advisor: 'ADVISOR',
        staff: 'STF',
        cluster_manager: 'CM',
        field_sales_executive: 'FSE'
    },
    TIME_TABLE: {
        MORNING_TIME: "10am to 7pm",
        AFTERNOON_TIME: "12am to 9pm",
        EVENING_TIME: "5pm to 2am",
        NIGHT_TIME: "7pm to 4am",
    },
    USER_IMAGE: 'assets/images/user',
    USER_CERTIFICATE: 'assets/certificate',
    USER_RESUME: 'assets/resume',
    OFFER_LETTER: 'assets/OfferLetter',
    EMAIL_TEMPLATE: {
        ADMIN_FORGOT_PASSWORD: 'forgot-password-for-admin',
        GENERATE_PASSWORD: 'generate-password-for-sub-admin',
    },
    COMPLETED: 'COMPLETED',
    OPEN: 'OPEN',
    CLOSE: 'CLOSE',
    FULL_TIME: 'full_time',
    PART_TIME: 'part_time',
    INTERNSHIP: 'internship',
    TIME_TABLE: {
        MORNING_TIME: "10am to 7pm",
        AFTERNOON_TIME: "12am to 9pm",
        EVENING_TIME: "5pm to 2am",
        NIGHT_TIME: "7pm to 4am",
    },
    IMAGESFOLDER: {
        WALLETSETTLEMENT: 'WalletSettlement',
        OFFERLETTER: 'OfferLetter'
    },
    USER_IMAGE: 'assets/images/user',
    USER_CERTIFICATE: 'assets/certificate',
    EMAIL_TEMPLATE: {
        ADMIN_FORGOT_PASSWORD: 'forgot-password-for-admin',
        GENERATE_PASSWORD: 'generate-password-for-sub-admin',
    },
    WEEKDAYS: {
        MONDAY: 'MO',
        TUESDAY: 'TU',
        WEDNESDAY: 'WE',
        THURSDAY: 'TH',
        FRIDAY: 'FR',
        SATURDAY: 'SA',
        SUNDAY: 'SU'
    },
    GlOBAL_IMAGE_PATH: '/assets/images/user',
    GlOBAL_CERTIFICATE_PATH: '/assets/certificate',
    USER_PROOF_TYPE: {
        adhar_card: 'ADHAR_CARD',
        voter_id: 'VOTER_Id',
        driving_liscence: 'DRIVING_LISCENCE',
        pan_card: 'PAN_CARD'
    },


    SUBSCRIPTION_PLAN_TYPE: {
        validity_plan: "Validity_Plan",
        resume_data_access_plan: "Resume_Data_Access_Plan",
        company_branding_plan: "Company_Branding_Plan",
        limit_extension_plan: "Limit_Extension_Plan"
    },

    SUBSCRIPTION_PLAN_TYPE_AREA: {
        metro: 'Metro',
        non_metro: 'Non_Metro'
    },

    SUBSCRIPTION_PLAN_SUB_TYPE: {
        classified: "Classified",
        hot_vacancy: "Hot_Vacancy"
    },

    // two month plan only
    SUBSCRIPTION_OFFER_TYPE: {
        two_month_plan_extension: 'Two_Month_Plan_Extension',
    },

    BOOSTING_TYPE: {
        No: 'N',
        One_State: '1',
        All_State: null
    },

    COMMISSION_AMOUNT: {
        sub_bc: 5,
        bc: 30
    }
}