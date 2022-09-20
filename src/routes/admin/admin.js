const router = require('express').Router();
const formidableMiddleware = require('express-formidable')
const connect = require('connect')

const AuthController = require('../../controllers/admin/AuthController');
const industriesController = require('../../controllers/admin/IndustriesController');
const sectorController = require('../../controllers/admin/SectorController');
const education_dataController = require('../../controllers/admin/educationDataController');
const SkillCategoryController = require('../../controllers/admin/skill_categoriesController');
const SkillSubCategoryController = require('../../controllers/admin/skill_SubcategoriesController');
const accountController = require('../../controllers/admin/accountController');
const jobController = require('../../controllers/admin/jobController');

const companyController = require('../../controllers/admin/companyController');
const candidateController = require('../../controllers/admin/candidateController');
const walletController = require('../../controllers/admin/walletController');
const companyStaffController = require('../../controllers/admin/companyStaffController');
const HomeServiceProviderController = require('../../controllers/admin/HomeServiceProviderController');
const subscriptionPlanController = require('../../controllers/admin/subscriptionPlanController');
const HomeServiceSeekerController = require('../../controllers/admin/HomeServiceSeekerController');
const LocalHunarController = require('../../controllers/admin/LocalHunarController');
const NotificationController = require('../../controllers/admin/NotificationController');

const MiscellaneousController = require("../../controllers/admin/MiscellaneousRoleController")
const ServiceCategoryController = require("../../controllers/admin/ServiceCategoryController");
const SpecializationContoller = require("../../controllers/admin/specializationController");
const TestimonialsContoller = require("../../controllers/admin/testimonialsController");
const StaticDataContoller = require("../../controllers/admin/staticDataController");


const { validateAdmin } = require("../../middlewares/api");
const PdfViewController = require('../../controllers/admin/pdfViewController');

const authMiddleware = (() => {
    const chain = connect();
    [formidableMiddleware()].forEach((middleware) => {
        chain.use(middleware)
    })
    return chain
})()

router.get("/dashboard", validateAdmin, industriesController.dashboard);

router.get("/login", AuthController.login);
router.post("/login", AuthController.loginauth);
router.get("/logout", AuthController.logOut)

router.get("/forgot-password", AuthController.forgotPassword);
router.post("/forgot-password", AuthController.forgotPasswordauth);
router.get("/forgot-password-otp", AuthController.resetPassword);
router.post("/forgot-password-otp", AuthController.resetPasswordotp);
router.get("/change-password", AuthController.getChangePassword);
router.post("/change-password", validateAdmin, AuthController.changePassword);

// industries
router.get("/create-industry", validateAdmin, industriesController.industry_create);
router.get("/industry/", validateAdmin, industriesController.industry)
router.post("/create-industry", validateAdmin, industriesController.add_industry_create);
router.get("/edit-industry/:id", validateAdmin, industriesController.industry_updateP);
router.post("/edit-industry/:id", validateAdmin, industriesController.industry_update);
router.get("/delete-industry/:id", validateAdmin, industriesController.industry_delete);

// sector
router.get('/sector/', validateAdmin, sectorController.sector)
router.get("/create-sector", validateAdmin, sectorController.sectorcreate);
router.post("/create-sector", validateAdmin, sectorController.addsectorcreate);
router.get("/edit-sector/:id", validateAdmin, sectorController.sectorupdateP);
router.post("/edit-sector/:id", validateAdmin, sectorController.sectorupdate);
router.get("/delete-sector/:id", validateAdmin, sectorController.sectordelete);

// education_data
router.get('/education_data/', validateAdmin, education_dataController.education_data)
router.get("/create-education_data", validateAdmin, education_dataController.education_datacreate);
router.post("/create-education_data", validateAdmin, education_dataController.addeducation_datacreate);
router.get("/edit-education_data/:id", validateAdmin, education_dataController.education_dataupdateP);
router.post("/edit-education_data/:id", validateAdmin, education_dataController.education_dataupdate);
router.get("/delete-education_data/:id", validateAdmin, education_dataController.education_datadelete);


// Skill category
router.get('/SkillCategory/', validateAdmin, SkillCategoryController.Skill_Category)
router.get("/create-SkillCategory", validateAdmin, SkillCategoryController.Skill_Categorycreate);
router.post("/create-SkillCategory", validateAdmin, SkillCategoryController.addSkill_Categorycreate);
router.get("/edit-SkillCategory/:id", validateAdmin, SkillCategoryController.Skill_CategoryupdateP);
router.post("/edit-SkillCategory/:id", validateAdmin, SkillCategoryController.Skill_Categoryupdate);
router.get("/delete-SkillCategory/:id", validateAdmin, SkillCategoryController.Skill_Categorydelete);

// Skill Sub category
router.get('/SkillSubCategory/', validateAdmin, SkillSubCategoryController.Skill_Sub_Category)
router.get("/create-SkillSubCategory", validateAdmin, SkillSubCategoryController.Skill_Sub_Categorycreate);
router.post("/create-SkillSubCategory", validateAdmin, SkillSubCategoryController.addSkill_Sub_Categorycreate);
router.get("/edit-SkillSubCategory/:id", validateAdmin, SkillSubCategoryController.Skill_Sub_CategoryupdateP);
router.post("/edit-SkillSubCategory/:id", validateAdmin, SkillSubCategoryController.Skill_Sub_Categoryupdate);
router.get("/delete-SkillSubCategory/:id", validateAdmin, SkillSubCategoryController.Skill_Sub_Categorydelete);

// company
router.get('/company/', validateAdmin, companyController.company)
router.get('/CS/', validateAdmin, companyController.company)
router.get('/create-company', validateAdmin, companyController.createCompany)
router.post('/create-company', validateAdmin, formidableMiddleware(), companyController.create_company)
router.get('/verify-company', validateAdmin, companyController.verify_company)
router.post('/verify-company', validateAdmin, companyController.verifyOtp_company)
router.get('/edit-company/:id', validateAdmin, companyController.edit_company)
router.post('/edit-company/:id', validateAdmin, formidableMiddleware(), companyController.update_company)
router.get('/delete-company/:id', validateAdmin, companyController.company_delete)
router.get('/company/view-company-subcriptions/:id', validateAdmin, companyController.companySubcriptions)
router.get('/company/view-details-company/:id', validateAdmin, companyController.companyDetails)
router.get('/company/view-chats-company/:id', validateAdmin, companyController.companyShowAllMessages)
router.get('/company/home-page-visiblity/:id', validateAdmin, companyController.homeVisiblity)

// not needed
// router.post('/company/home-page-visiblity/:id',validateAdmin, companyController.homePageVisiblity)
router.get('/view-message-company/', validateAdmin, companyController.companyShowMessages)

// company staff
router.get('/company/view-company-staff/:id', validateAdmin, companyStaffController.company_staff)
router.get('/create-company-staff/:id', validateAdmin, companyStaffController.createCompanyStaff)
router.post('/create-company-staff/:id', validateAdmin, formidableMiddleware(), companyStaffController.create_CompanyStaff)
router.get('/verify-company-staff', validateAdmin, companyStaffController.verify_company_staff)
router.post('/verify-company-staff', validateAdmin, companyStaffController.verifyOtp_company_staff)
router.get('/edit-company-staff/:id', validateAdmin, companyStaffController.edit_companyStaff)
router.post('/edit-company-staff/:id', validateAdmin, formidableMiddleware(), companyStaffController.update_companyStaff)
router.get('/delete-company-staff/:id', validateAdmin, companyStaffController.companyStaff_delete)
router.get('/company-staff/view-details-company-staff/:id', validateAdmin, companyStaffController.companyStaff_details)

//job-post 
router.get('/company/add-job-post/:id', validateAdmin, jobController.addJobPost)
router.post('/company/add-job-post/:id', validateAdmin, jobController.createJobPost)
router.get('/company/edit-job-post/:id', validateAdmin, jobController.editJob)
router.post('/company/edit-job-post/:id', validateAdmin, jobController.editJobPost)
router.get('/company/delete-job-post/:id', validateAdmin, jobController.deleteJob)
router.get('/company/get-all-job-post', validateAdmin, jobController.getAllPost)
router.get('/company/get-all-job-post/:id', validateAdmin, jobController.getAllPost)
router.get('/company/job-post-detail/questions/:id', validateAdmin, jobController.getAllQues)
router.get('/company/get-job-post-details/:id', validateAdmin, jobController.getPostDetails)
router.get('/company/applied-job/:id', validateAdmin, jobController.getAppliedJobs)
router.get('/company/show-user/:id', validateAdmin, jobController.getShowUser)
router.post('/company/job-post/questions/:id', validateAdmin, jobController.addQues)
router.get('/company/job-post/delete-questions/:id', validateAdmin, jobController.deleteJobQuestions)
router.get('/company/job-post/questions/:id', validateAdmin, jobController.addQuesPage)
router.get('/post-govt-job/', validateAdmin, jobController.ShowaddJobGovtPost);
router.post('/company/add-job-post-govt/', validateAdmin, formidableMiddleware(), jobController.addJobGovtPost);
router.get('/get-job-post-govt', validateAdmin, jobController.getAllGovtPost);
router.get('/get-testimonials', validateAdmin, TestimonialsContoller.getTestimonials);
router.get('/add-testimonials', validateAdmin, TestimonialsContoller.addTestimonials);
router.post('/create-testimonials', validateAdmin, formidableMiddleware(), TestimonialsContoller.createTestimonial);
router.get('/testimonials-details/:id', validateAdmin, TestimonialsContoller.testimonialsDetails);
router.get('/edit-testimonials/:id', validateAdmin, TestimonialsContoller.editTestimonials);
router.get('/delete-testimonials/:id', validateAdmin, TestimonialsContoller.deleteTestimonials);
router.post('/update-testimonials/:id', validateAdmin, TestimonialsContoller.updateTestimonials);
router.get('/static-data', validateAdmin, StaticDataContoller.getStaticData);
router.get('/preview-html/:key', validateAdmin, StaticDataContoller.previewHtml);
router.get('/add-html/:key', validateAdmin, StaticDataContoller.addHtml);
router.post('/edit-html/:key', validateAdmin, StaticDataContoller.editHtml);

// candidate
router.get('/candidate/', validateAdmin, candidateController.candidate)
router.get('/js/', validateAdmin, candidateController.candidate)
router.get('/create-candidate', validateAdmin, candidateController.createCandidate)
router.post('/create-candidate', validateAdmin, formidableMiddleware(), candidateController.create_candidate)
router.get('/edit-candidate/:id', validateAdmin, candidateController.edit_candidate)
router.post('/edit-candidate/:id', validateAdmin, formidableMiddleware(), candidateController.update_candidate)
router.get('/delete-candidate/:id', validateAdmin, candidateController.candidate_delete)
router.get('/verify-candidate', validateAdmin, candidateController.verify_candidate)
router.post('/verify-candidate', validateAdmin, candidateController.verifyOtp_candidate)
router.get('/view-details-candidate/:id', validateAdmin, candidateController.candidateDetails)
router.get('/view-chats-candidate/:id', validateAdmin, candidateController.candidateShowAllMessages)
router.get('/view-message-candidate/', validateAdmin, candidateController.candidateShowMessages)
router.get('/candidate/view-candidate-subcriptions/:id', validateAdmin, candidateController.candidateSubcriptions)
router.get('/candidate/applied-job/:id', validateAdmin, candidateController.getAppliedJobs)
router.get('/candidate/show-job-details/:id', validateAdmin, candidateController.jobsDetails)
router.get('/candidate/job-post-detail/questions-answers/:id', validateAdmin, candidateController.quesAns)

router.get('/downoad-excel', validateAdmin, candidateController.downoadExcel)

// accounts
router.get('/account/active', validateAdmin, accountController.activeaccount)
router.get('/account/active/inactive/:id', validateAdmin, accountController.activeInactiveaccount)
router.get('/account/inactive', validateAdmin, accountController.inactiveaccount)
router.get('/account/view-user-details/:id', validateAdmin, accountController.getUser)

// wallet
router.get('/wallet-transaction', validateAdmin, walletController.wallet)
router.get('/pending-payment-requests', validateAdmin, walletController.pendingPayments)
router.post('/pending-payment-requests/accept/:id', validateAdmin, formidableMiddleware(), walletController.acceptPendingPayments)
router.get('/pending-payment-requests/reject/:id', validateAdmin, walletController.rejectPendingPayments)
router.get('/active-payment-requests', validateAdmin, walletController.activePayments)
router.get('/wallet-transactions/:id', validateAdmin, walletController.allTransactions)

// Home Service Provider
router.get('/service-provider', validateAdmin, HomeServiceProviderController.serviceProvider)
router.get('/HSP', validateAdmin, HomeServiceProviderController.serviceProvider)
router.get('/service-provider-details/:id', validateAdmin, HomeServiceProviderController.serviceProviderDetails)
router.get('/create-service-provider', validateAdmin, HomeServiceProviderController.createServiceProvider)
router.post('/create-service-provider', validateAdmin, formidableMiddleware(), HomeServiceProviderController.addServiceProvider)
router.get('/verify-home-service-provider', validateAdmin, HomeServiceProviderController.verifyServiceProvider)
router.post('/verify-home-service-provider', validateAdmin, HomeServiceProviderController.verify_ServiceProvider)
router.get('/edit-service-provider/:id', validateAdmin, HomeServiceProviderController.editServiceProvider)
router.post('/edit-service-provider/:id', validateAdmin, formidableMiddleware(), HomeServiceProviderController.updateServiceProvider)
router.get('/delete-service-provider/:id', validateAdmin, HomeServiceProviderController.deleteServiceProvider)
router.get('/service-provider-all-services/:id', validateAdmin, HomeServiceProviderController.getAllServices)
router.get('/view-ratings-reviews/:id', validateAdmin, HomeServiceProviderController.getRatings)
router.get('/delete-rating-review/:id', validateAdmin, HomeServiceProviderController.deleteReviewRating)
router.get('/view-service-request/:id', validateAdmin, HomeServiceProviderController.getRequests)
router.get('/add-service', validateAdmin, HomeServiceProviderController.addService)
router.get('/get-service/:id', validateAdmin, HomeServiceProviderController.getServiceById)
router.get('/delete-service/:id', validateAdmin, HomeServiceProviderController.deleteService)
router.post('/create-service/:id', validateAdmin, formidableMiddleware({ multiples: true }), HomeServiceProviderController.createService)
router.get('/add-branch', validateAdmin, HomeServiceProviderController.addBranch)
router.get('/get-all-branches/:id', validateAdmin, HomeServiceProviderController.getAllBranches)
router.post('/create-branch/:id', validateAdmin, HomeServiceProviderController.createBranch)
router.get('/delete-branch/:id', validateAdmin, HomeServiceProviderController.deleteBranch)

// Home Service Seeker 
router.get('/service-seeker/', validateAdmin, HomeServiceSeekerController.serviceSeeker)
router.get('/HSS/', validateAdmin, HomeServiceSeekerController.serviceSeeker)
router.get('/service-seeker-details/:id', validateAdmin, HomeServiceSeekerController.serviceSeekerDetails)
router.get('/create-service-seeker', validateAdmin, HomeServiceSeekerController.createServiceSeeker)
router.post('/create-service-seeker', validateAdmin, formidableMiddleware(), HomeServiceSeekerController.addServiceSeeker)
router.get('/verify-home-service-seeker', validateAdmin, HomeServiceSeekerController.verifyServiceSeeker)
router.post('/verify-home-service-seeker', validateAdmin, HomeServiceSeekerController.verify_ServiceSeeker)
router.get('/edit-service-seeker/:id', validateAdmin, HomeServiceSeekerController.editServiceSeeker)
router.post('/edit-service-seeker/:id', validateAdmin, formidableMiddleware(), HomeServiceSeekerController.updateServiceSeeker)
router.get('/delete-service-seeker/:id', validateAdmin, HomeServiceSeekerController.deleteServiceSeeker)
router.get('/service-seeker-all-services/:id', validateAdmin, HomeServiceSeekerController.getAllServices)

//Subscription Plan
router.get('/subscription-plans', validateAdmin, subscriptionPlanController.SubscriptionPlanList);
router.get('/subscription-plan-details/:id', validateAdmin, subscriptionPlanController.SubscriptionPlanDetails);
router.get('/create-subscription-plan', validateAdmin, subscriptionPlanController.CreateSubscription);
router.post('/create-subscription-plan', validateAdmin, subscriptionPlanController.AddSubscriptionPlan);
router.get('/edit-subscription-plan/:id', validateAdmin, subscriptionPlanController.UpdateSubscriptionPlanP);
router.post('/edit-subscription-plan/:id', validateAdmin, subscriptionPlanController.UpdateSubscritionPlan);
router.get('/delete-subscription-plan/:id', validateAdmin, subscriptionPlanController.DeleteSubscriptionPlan);
router.get('/subscription-plan/:id/subscribed-users', validateAdmin, subscriptionPlanController.SubscribedUsers)

//local hunar
router.get('/local-hunar', validateAdmin, LocalHunarController.localHunar)
router.get('/LH', validateAdmin, LocalHunarController.localHunar)
router.get('/local-hunar-details/:id', validateAdmin, LocalHunarController.localHunarDetails)
router.get('/create-local-hunar', validateAdmin, LocalHunarController.createLocalHunar)
router.post('/create-local-hunar', validateAdmin, LocalHunarController.addLocalHunar)
router.get('/edit-local-hunar/:id', validateAdmin, LocalHunarController.editLocalHunar)
router.post('/edit-local-hunar/:id', validateAdmin, LocalHunarController.updateLocalHunar)
router.get('/delete-local-hunar/:id', validateAdmin, LocalHunarController.deleteLocalHunar)
router.get('/local-hunar-videos/pending-permissions', validateAdmin, LocalHunarController.pendingVideoPermissions)
router.get('/local-hunar-videos/approve/:id', validateAdmin, LocalHunarController.approveVideo)
router.get('/local-hunar-videos/disapprove/:id', validateAdmin, LocalHunarController.disapproveVideo)
router.get('/local-hunar-videos/active-permissions', validateAdmin, LocalHunarController.activeVideoPermissions)
router.get('/local-hunar/:id/videos', validateAdmin, LocalHunarController.userVideos)
router.get('/local-hunar/:id/add-video', validateAdmin, LocalHunarController.createVideo)
router.post('/local-hunar/:id/add-video', validateAdmin, formidableMiddleware(), LocalHunarController.addVideo)

router.get('/local-hunar/edit-video/:id', validateAdmin, LocalHunarController.editVideo)
router.post('/local-hunar/edit-video/:id', validateAdmin, LocalHunarController.updateVideo)
router.get('/local-hunar/delete-video/:id', validateAdmin, LocalHunarController.deleteVideo)

//Notification
router.get('/send-notification', validateAdmin, NotificationController.getNotificationPage)
router.post('/send-notification', validateAdmin, NotificationController.sendNotification)

// add miscellaneous roles ->
router.get('/miscellaneous-roles', validateAdmin, MiscellaneousController.showMiscellaneousRoles)
router.get('/BC', validateAdmin, MiscellaneousController.showMiscellaneousRoles)
router.get('/CM', validateAdmin, MiscellaneousController.showMiscellaneousRoles)
router.get('/FSE', validateAdmin, MiscellaneousController.showMiscellaneousRoles)
router.get('/Advisor', validateAdmin, MiscellaneousController.showMiscellaneousRoles)
router.get('/business-partner-transaction-history', validateAdmin, MiscellaneousController.showbusinessPartnerTransaction)
router.get('/unapproved-business-partner-roles', validateAdmin, MiscellaneousController.showUnApprovedBusinessPartnerRoles)
router.get('/approve-business-partner/:id', validateAdmin, MiscellaneousController.approveBusinessPartner)
router.get('/miscellaneous-role-details/:id', validateAdmin, MiscellaneousController.showMiscellaneousUserDetails)
router.get('/delete-miscellaneous-role/:id', validateAdmin, MiscellaneousController.deleteMiscellaneousUserDetails);
router.get('/show-edit-miscellaneous-role/:id', validateAdmin, MiscellaneousController.showEditMiscellaneousUser);

router.get('/miscellaneous-role-reference-table/:id', validateAdmin, MiscellaneousController.showMiscellaneousRolesReferenceTable)
router.get('/miscellaneous-user-registered-users/:id', validateAdmin, MiscellaneousController.showMiscellaneousRolesCreatedUser)
router.get('/miscellaneous-commission-details/:id', validateAdmin, MiscellaneousController.showMiscellaneousRolesCommissionDetails)
router.get('/business-partner-commission-details', validateAdmin, MiscellaneousController.showBusinessPartnerCommissionDetails)


// miscellaneous Roles                     
router.get('/create-form-miscellaneous-roles', validateAdmin, MiscellaneousController.showAddMiscellaneous)
router.post('/add-miscellaneous-roles', validateAdmin, formidableMiddleware(), MiscellaneousController.createMiscellaneousRole)
router.post('/edit-miscellaneous-role/:id', validateAdmin, formidableMiddleware(), MiscellaneousController.editMiscellaneousUser);


// miscellaneous user basic details     
router.get('/create-form-basic-details/:id', validateAdmin, MiscellaneousController.showAddBasicDetails)
router.post('/add-miscellaneous-basic-details/:id', validateAdmin, formidableMiddleware({ multiples: true }), MiscellaneousController.createBasicDetail)
router.post('/edit-miscellaneous-basic-details/:id', validateAdmin, formidableMiddleware({ multiples: true }), MiscellaneousController.editBasicDetailsUser)

// miscellaneous user bussiness details
router.get('/create-form-bussiness-correspondence/:id', validateAdmin, MiscellaneousController.showAddBussinessCorrespondence)
router.post('/add-miscellaneous-bussiness-details/:id', validateAdmin, formidableMiddleware(), MiscellaneousController.createBussinessDetail)
router.post('/edit-miscellaneous-bussiness-details/:id', validateAdmin, formidableMiddleware(), MiscellaneousController.editBussinessDetails)

// ServiceCategory
router.get('/create-form-service-category', validateAdmin, ServiceCategoryController.showAddServiceCategory);
router.post('/add-service-category', validateAdmin, formidableMiddleware(), ServiceCategoryController.addServiceCategory);
router.get('/service-category', validateAdmin, ServiceCategoryController.showServiceCategory);
router.get('/service-category-delete/:id', validateAdmin, ServiceCategoryController.ServiceCategoryDelete);
router.get('/show-edit-service-category/:id', validateAdmin, ServiceCategoryController.showEditServiceCategory);
router.post('/edit-service-category/:id', validateAdmin, formidableMiddleware(), ServiceCategoryController.editServiceCategory);
router.get('/download-submitted-resumes', validateAdmin, companyController.showResumePage);

// specialization
router.get('/show-add-specialization', validateAdmin, SpecializationContoller.showAddSpecialization);
router.post('/create-specialization', validateAdmin, SpecializationContoller.addSpecialization);
router.get('/show-specialization', validateAdmin, SpecializationContoller.showSpecialization);
router.get('/show-edit-specialization/:id', validateAdmin, SpecializationContoller.showSpecializationUpdate);
router.post('/edit-specialization/:id', validateAdmin, SpecializationContoller.SpecializationUpdate);
router.get('/delete-specialization/:id', validateAdmin, SpecializationContoller.specializationDelete);


// pdf routes 

router.get('/candidate-pdf-download/:roleType', validateAdmin, PdfViewController.candidateDownloadPdf);
router.get('/candidate-pdf-view/:roleType', PdfViewController.candidatePdfView);
router.get('/candidate-wallet-pdf-download/:id', validateAdmin, PdfViewController.candidateWalletPdf);
router.get('/candidate-wallet-pdf-view/:id', PdfViewController.candidateWalletPdfView);
router.get('/bill-claim-view', PdfViewController.billClaimViewPdf);
router.get('/bill-claim-download', PdfViewController.billClaimDownloadPdf);
router.get('/commission-details-view/:id', PdfViewController.commissionDetailsView);
router.get('/commission-details-download/:id', PdfViewController.commissionDetailsDownloadPdf);
router.get('/resume-view', PdfViewController.resumeViewPdf);
router.get('/resume-download', PdfViewController.resumeDownloadPdf);
router.get('/subscription-details-view/:id', PdfViewController.subscriptionDetailsViewPdf);
router.get('/subscription-details-download/:id', PdfViewController.subscriptionDetailsDownloadPdf);
router.get('/business-partner-commission-details-view', PdfViewController.commissionDetailsOfBusinessPartnerView);
router.get('/business-partner-commission-details-download', PdfViewController.commissionDetailsOfBusinessPartnerDownloadPdf);


module.exports = router;