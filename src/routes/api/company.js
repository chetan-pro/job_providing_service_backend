const router = require('express').Router()
const formidableMiddleware = require('express-formidable');
const connect = require('connect')
const { validateCompanyOrStaff, validateCompany, validateCandidate, commonAuth } = require('../../middlewares/api')
const CompanyController = require('../../controllers/api/CompanyController');
const SkillCategoryController = require('../../controllers/api/SkillCategoryController')
const OfferLetterController = require('../../controllers/api/OfferLetterController')
const AppliedJobsController = require('../../controllers/api/AppliedJobsController')
const JobPostAnswerController = require("../../controllers/api/AnswerController");

const authMiddleware = (() => {
    const chain = connect();
    [formidableMiddleware(), validateCompanyOrStaff].forEach((middleware) => {
        chain.use(middleware)
    })
    return chain
})()

//company
router.post('/register', formidableMiddleware(), CompanyController.register);
router.post('/job-post', formidableMiddleware(), validateCompanyOrStaff, CompanyController.jobPost)
router.get('/get-job-post', validateCompanyOrStaff, CompanyController.getJobPost)
router.post('/edit-job-post', validateCompanyOrStaff, formidableMiddleware(), CompanyController.EditJobPost)
router.post('/update-company-social-login', commonAuth, formidableMiddleware(), CompanyController.UpdateCompanySocialLink)
router.delete('/delete-job-post/:id', validateCompanyOrStaff, CompanyController.deleteJobPost)
router.post('/change-post-status', validateCompanyOrStaff, CompanyController.changeStatus)

router.post('/change-job-status', validateCompanyOrStaff, CompanyController.changeJobStatus)
router.get('/open-close-job-list', validateCompanyOrStaff, CompanyController.OpenCloseJobList)
router.get('/get-user-by-id', commonAuth, CompanyController.GetUserById);
router.post('/edit-company-profile', formidableMiddleware(), validateCompanyOrStaff, CompanyController.editCompanyProfile)
router.post('/edit-company-overview', validateCompanyOrStaff, CompanyController.editCompanyOverview)
router.get('/get-company-overiew', validateCompanyOrStaff, CompanyController.getCompanyOverview);
// CompanyDashboard
router.get('/get-company-dashboard', validateCompanyOrStaff, CompanyController.CompanyDashboard);

//Category
router.get('/skill-category-list', SkillCategoryController.skillCategoryList);
router.get('/skill-sub-category-list/:skill_category_id', SkillCategoryController.skillSubCategoryList);

//
router.get('/education-list', CompanyController.educationList)
router.get('/job-type-list', CompanyController.jobTypeList)

//email verification
router.post('/verify-company-email', CompanyController.EmailVerification)
router.post('/resend-otp', CompanyController.resendOTP)
router.get('/applied-job-list/:id', OfferLetterController.AppliedJobList)
router.post('/accept-reject-job-application', validateCompanyOrStaff, OfferLetterController.AcceptRejectJobApplication)
router.post('/send-offer-letter', validateCompanyOrStaff, formidableMiddleware(), OfferLetterController.SendOfferLetter)
router.post('/remove-reject-shortlisted-candidate', validateCompanyOrStaff, OfferLetterController.RemoveOrRejectShortlistedCandidate)


//applied job
router.get('/get-by-job-id-applied-jobs', validateCompanyOrStaff, AppliedJobsController.getAppliedJobById)
router.get('/get-user-applied', validateCompanyOrStaff, AppliedJobsController.getUserApplied)
router.post('/add-user-applied-jobs-company', validateCompanyOrStaff, formidableMiddleware(), AppliedJobsController.CompanySelect);

//jobPostQuestion
router.post('/add-job-post-answer/:queId', validateCandidate, JobPostAnswerController.AddJobPostAnswer)

// homepage visible companylist
router.get('/get-homepage-visible-company', CompanyController.getAllCompaniesHomepage)

// get counts
router.get("/get-job-type-count", validateCandidate, CompanyController.GetCountJobsType);
router.get("/get-job-industry-count", validateCandidate, CompanyController.getIndustryCountInfo);

router.post('/add-resume-access-data', validateCompanyOrStaff, AppliedJobsController.addResumeAccessDetails);

module.exports = router