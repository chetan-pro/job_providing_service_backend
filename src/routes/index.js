// const router = require('express').Router()
// const apiRoute = require('./api/app')
// const adminRoute = require('./admin/admin')
// router.use('/api', apiRoute)
//
// router.use('/admin', adminRoute)
// module.exports = router


module.exports = {
    adminRoutes: require('./admin/admin'),
    apiUserRoutes: require('./api/app'),
    apiCompanyRoutes: require('./api/company'),
    apiStaffRoutes: require('./api/staff'),
    apiWalletRoutes: require('./api/wallet'),
    apiChatRoutes: require('./api/chat'),
    apiResumeRoutes: require('./api/resume'),
    apiLandingPageRoutes: require('./api/landing'),
}