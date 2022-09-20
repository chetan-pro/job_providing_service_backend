const router = require('express').Router()
const CompanyController = require('../../controllers/api/CompanyController');
const LandingPageController = require('../../controllers/api/LandingPageController')
router.get('/get-landing-page-visible-company', CompanyController.getAllCompaniesHomepage);
router.get('/get-landing-page-jobs', LandingPageController.landingPageJobs);
router.get('/get-landing-page-home-services', LandingPageController.landingPageHomeServices);
router.get('/get-landing-page-local-hunar', LandingPageController.landingPageLocalHunar);
router.get('/get-landing-page-user-counts', LandingPageController.landingPageCount);
router.get('/get-landing-page-testimonials', LandingPageController.landingPageTestimonials);
router.get('/get-landing-page-static-data/:key', LandingPageController.landingPageStaticData);
module.exports = router;