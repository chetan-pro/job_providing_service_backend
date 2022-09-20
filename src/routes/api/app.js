    const router = require('express').Router()
    const formidableMiddleware = require('express-formidable')
    const connect = require('connect')
    const AuthController = require('../../controllers/api/AuthController')
    const UserController = require('../../controllers/api/UserControlller')
    const RoleController = require('../../controllers/api/RoleController')
    const CityController = require('../../controllers/api/CityController')
    const IndustryController = require('../../controllers/api/IndustryController')
    const LanguageController = require('../../controllers/api/LanguageController')
    const SubscriptionPlanController = require('../../controllers/api/SubscriptionPlanController')
    const PaymentController = require('../../controllers/api/PaymentController')
    const CurrentJobController = require('../../controllers/api/CurrentJobController')
    const WorkExpController = require('../../controllers/api/WorkExpController')
    const SpecializationController = require('../../controllers/api/SpecializationController')
    const EducationController = require('../../controllers/api/EducationController')
    const CertificationController = require('../../controllers/api/CertificationController')
    const JobController = require('../../controllers/api/JobController')
    const CompanyEnvController = require('../../controllers/api/CompanyEnvController')
    const CustomAlertController = require('../../controllers/api/CustomAlertController')
    const SavedJobController = require('../../controllers/api/SavedJobController')
    const LikedJobsController = require('../../controllers/api/LikedJobsController')
    const AppliedJobsController = require('../../controllers/api/AppliedJobsController')
    const BankDetailsController = require('../../controllers/api/BankDetailsController')
    const OfferLetterController = require('../../controllers/api/OfferLetterController')
    const InterstedJobController = require('../../controllers/api/InterstedJobController')
    const Service = require("../../controllers/api/ServiceController");
    const ServiceProviderBranch = require("../../controllers/api/serviceProviderBranchController");
    const ServiceCategory = require("../../controllers/api/ServiceCategoryController")
    const ServiceDays = require("../../controllers/api/serviceDaysController");
    const ServiceImage = require("../../controllers/api/serviceImageController");
    const serviceRequest = require("../../controllers/api/ServiceRequestController");
    const RateServiceRequest = require("../../controllers/api/RateServiceRequestController");
    const UserViewJobPost = require("../../controllers/api/UserViewJobController");
    const ServiceProviderDocument = require("../../controllers/api/ServiceProviderDocumetController");
    const LocalHunarVideos = require("../../controllers/api/LocalHunarVideoController");
    const Notification = require("../../controllers/api/NotificationController");
    const MiscellaneousUserController = require("../../controllers/api/MiscellaneousUserController");
    const { validateHomeServiceSeeker, validateCandidate, validateCompanyOrStaff, commonAuth, validateCompanyOrCandidate, validateHomeServiceProvider, validateLocalHunar, validateMiscellaneousUser, validateApprovedMiscellaneousUser } = require('../../middlewares/api')
    const WalletSettlementController = require('../../controllers/api/WalletSettlementController')
    const authMiddleware = (() => {
            const chain = connect();
            [formidableMiddleware(), validateCandidate, commonAuth, validateCompanyOrStaff, validateCompanyOrCandidate].forEach((middleware) => {
                chain.use(middleware)
            })
            return chain
        })()
        // candidate Sign up
    router.post('/sign-up', AuthController.signUp);
    router.post('/sign-up-v2', formidableMiddleware(), AuthController.signUpV2);
    router.post('/login', AuthController.login)
    router.post('/forgot-password', AuthController.forgotPassword)
    router.post('/social-login', AuthController.socialLogin)
    router.post('/reset-password', AuthController.resetPassword)
    router.post('/update-social-login', commonAuth, formidableMiddleware(), AuthController.UpdateCandidateSocialLink)
        //User
    router.post('/contact-us', UserController.Contact_us)
    router.get('/user-profile', commonAuth, UserController.myProfile)
    router.post('/edit-user-profile', formidableMiddleware(), commonAuth, UserController.editProfile)
    router.post('/update-is-user-available', validateCandidate, UserController.changeIsUserAvailable)
    router.get('/get-is-user-available', validateCandidate, UserController.GetIsUserAvailable)
    router.post('/add-user-fcm-token', commonAuth, UserController.AddFcmToken)
        // universal/common for all
    router.post('/change-password', commonAuth, AuthController.changePassword)
    router.post('/change-role-type', commonAuth, AuthController.changeUserRoleType)
        //Role
    router.get('/role-list', RoleController.roleList)

    //State
    router.get('/state-list', CityController.StateList)

    //City
    router.get('/city-list', CityController.CityList);
    router.get('/pin-code-details', CityController.PinCodeDetailList);

    router.get('/subscription-plan-list', commonAuth, SubscriptionPlanController.subscriptionPlanList)

    //industry
    router.get('/industry-list', IndustryController.IndustryList);
    router.get('/sector-list', IndustryController.SectorList);

    //payment
    router.post('/create-order-id', commonAuth, PaymentController.CreateOrderId)
    router.post('/verify-payment', commonAuth, PaymentController.VerifyPayment)
    router.post('/verify-payment-v2', commonAuth, PaymentController.paymentVerify)


    router.get('/get-transaction-histories', commonAuth, PaymentController.TransactionHistories)
    router.post('/activate-subscribed-plans', commonAuth, PaymentController.activatePlan)
    router.get('/get-all-transaction-histories', commonAuth, PaymentController.getAllTransactionHistory)


    //Language
    router.get('/language-list', LanguageController.LanguageList);
    router.post('/add-language', validateCandidate, LanguageController.AddLanguage);
    router.post('/edit-language', validateCandidate, LanguageController.EditLanguage);
    router.delete('/delete-language/:id', validateCandidate, LanguageController.deleteLanguage);
    router.get('/user-language-list', validateCandidate, LanguageController.UserLanguageList);

    //current job detail
    router.get('/current-job-detail', validateCandidate, CurrentJobController.UserCurrentJob);
    router.post('/add-current-job', validateCandidate, CurrentJobController.AddCurrentJob);
    router.post('/edit-current-job', validateCandidate, CurrentJobController.EditCurrentJob);
    router.delete('/delete-current-job/:id', validateCandidate, CurrentJobController.deleteCurrentJob);

    // view Job
    router.post('/add-view-job', validateCandidate, UserViewJobPost.addViewjob);
    router.get('/get-view-job', validateCandidate, UserViewJobPost.getViewJob);

    //work experience
    router.get('/user-work-experience-list', validateCandidate, WorkExpController.UserWorkExperienceList);
    router.post('/add-work-experience', validateCandidate, WorkExpController.AddWorkExperience);
    router.post('/edit-work-experience', validateCandidate, WorkExpController.EditWorkExperience);
    router.delete('/delete-work-experience/:id', validateCandidate, WorkExpController.deleteWorkExperience);

    //
    router.get('/course-list', SpecializationController.CourseList);
    router.get('/specialization-list/:course_id', SpecializationController.SpecializationList);

    //education
    //work experience
    router.get('/user-education-list', validateCandidate, EducationController.UserEducationList);
    router.post('/add-education', validateCandidate, EducationController.AddEducation);
    router.post('/edit-education', validateCandidate, EducationController.EditEducation);
    router.delete('/delete-education/:id', validateCandidate, EducationController.DeleteEducation);

    //Certificate
    router.get('/user-certificate-list', validateCandidate, CertificationController.UserCertificationList);
    router.post('/add-certificate', validateCandidate, formidableMiddleware(), CertificationController.AddCertification);
    router.post('/edit-certificate', validateCandidate, formidableMiddleware(), CertificationController.EditCerificate);
    router.delete('/delete-certificate/:id', validateCandidate, formidableMiddleware(), CertificationController.DeleteCertificate);

    //Job Serach Page
    router.get('/job-search-list', commonAuth, JobController.JobSearchList);
    router.get('/job-detail/:id', commonAuth, JobController.JobPage);
    router.get('/company-page/:id', commonAuth, JobController.CompanyPage);
    router.get('/user-recommended-job-list', validateCandidate, JobController.ReCommandedJobs);
    router.get('/job-role-type-list', commonAuth, JobController.JobTypeRoleList)

    //subscribed user
    router.get('/subscribed-user-detail', commonAuth, PaymentController.SubscribedUserDetail);

    //Company photo
    router.get('/company-photo-list', validateCompanyOrStaff, CompanyEnvController.CompanyPhotoList);
    router.post('/add-company-photo', validateCompanyOrStaff, formidableMiddleware(), CompanyEnvController.AddCompanyPhoto);
    router.post('/edit-company-photo', validateCompanyOrStaff, formidableMiddleware(), CompanyEnvController.EditCompanyPhoto);
    router.delete('/delete-company-photo/:id', validateCompanyOrStaff, formidableMiddleware(), CompanyEnvController.deleteCompanyPhoto);

    //Custom alert
    router.get('/user-custom-alert-list', validateCandidate, CustomAlertController.UserCustomAlertList);
    router.post('/add-custom-alert', validateCandidate, CustomAlertController.AddCustomAlert);
    router.post('/edit-custom-alert', validateCandidate, CustomAlertController.EditCustomAlert);
    router.delete('/delete-custom-alert/:id', validateCandidate, CustomAlertController.deleteCustomAlert);
    router.get('/company-list', validateCandidate, CustomAlertController.CompanyList);

    //saved jobs
    router.get('/user-saved-job-list', commonAuth, SavedJobController.UserSavedJobsList);
    router.post('/add-user-saved-jobs/:id', commonAuth, SavedJobController.AddUserSavedJob);
    router.delete('/delete-user-saved-job/:id', commonAuth, SavedJobController.deleteSavedJob);

    //liked jobs
    router.get('/user-liked-job-list', validateCandidate, LikedJobsController.UserLikedJobsList);
    router.post('/add-user-liked-jobs/:id', validateCandidate, LikedJobsController.AddUserSavedJob);
    router.delete('/delete-user-liked-job/:id', validateCandidate, LikedJobsController.deleteLikedJob);

    //applied jobs
    router.get('/user-applied-job-list', validateCandidate, AppliedJobsController.UserAppliedJobsList);
    router.post('/add-user-applied-jobs', validateCandidate, formidableMiddleware(), AppliedJobsController.UserAddAppliedJob);
    //applied jobs
    router.get('/user-short-job-list', validateCandidate, AppliedJobsController.ShortListedJobsList);

    // notInterested jobs
    router.get('/user-not-interested-job-list', validateCandidate, AppliedJobsController.notInterestedjobList);


    // add bank details
    router.get('/get-bank-details', commonAuth, BankDetailsController.GetBankDetail);
    router.post('/add-bank-details', commonAuth, BankDetailsController.AddBankDetails);
    router.post('/update-bank-details', commonAuth, BankDetailsController.UpdateBankDetails);

    //settlements 
    router.post('/create-settlement', commonAuth, formidableMiddleware(), WalletSettlementController.CreateSettlement);
    router.get('/get-settlement', commonAuth, WalletSettlementController.GetSettlements);
    router.get('/make-a-settlement', commonAuth, WalletSettlementController.MakeASettlement);

    //deep link
    router.get('/get-dynamic-link', commonAuth, UserController.CreateDynamicLink);

    //not intersted
    router.get('/get-not-intersted-job', validateCandidate, InterstedJobController.NotInterestedList);
    router.post('/add-not-intersted-job/:id', validateCandidate, InterstedJobController.AddNotInterestedJob);
    router.delete('/delete-not-intersted-job/:id', validateCandidate, InterstedJobController.deleteNotInterestedJob);

    //offer letter
    router.post('/user-accept-reject-offer-letter', validateCandidate, OfferLetterController.AcceptRejectJobOfferLetter);

    //ServiceProviderBranch
    router.post("/add-service-provider-branch", validateHomeServiceProvider, ServiceProviderBranch.AddServiceProviderBranch);
    router.get("/get-service-provider-branchList", validateHomeServiceProvider, ServiceProviderBranch.ServiceProviderBranchList);
    router.delete("/delete-service-provider-branch/:id", validateHomeServiceProvider, ServiceProviderBranch.DeleteServiceProviderBranch)
    router.post("/update-service-provider-branch", validateHomeServiceProvider, ServiceProviderBranch.UpdateServiceProviderBranch)

    //serviceProvider category (Admin)
    router.post("/add-service-provider-category", validateHomeServiceProvider, ServiceCategory.AddServiceCategory)
    router.get("/get-service-provider-categories", validateHomeServiceProvider, ServiceCategory.ServiceCategoriesList)
    router.delete("/delete-service-provider-categories/:id", validateHomeServiceProvider, ServiceCategory.DeleteServiceCategory)
    router.post("/update-service-provider-categories/:id", validateHomeServiceProvider, ServiceCategory.UpdateServiceCategory);

    //serviceDays (Admin)
    router.post("/add-service-days", validateHomeServiceProvider, ServiceDays.AddDays);
    router.get("/get-service-days", validateHomeServiceProvider, ServiceDays.DayList);

    //ServiceImage (Admin)
    router.post("/add-service-image", validateHomeServiceProvider, formidableMiddleware(), ServiceImage.AddImage);

    //service Provider service 
    router.post("/add-service", validateHomeServiceProvider, formidableMiddleware({ multiples: true }), Service.AddService)
    router.get("/get-service", validateHomeServiceProvider, Service.ServiceList);
    router.delete("/delete-service/:id", validateHomeServiceProvider, Service.DeleteService);
    router.post("/update-service", validateHomeServiceProvider, formidableMiddleware({ multiples: true }), Service.UpdateService);
    router.post("/update-service-status/:id", validateHomeServiceProvider, Service.UpdateServiceStatus);

    router.get("/get-category-count-info", validateHomeServiceSeeker, Service.getCategoryCountInfo);


    // serviceProviderDashboard
    router.get("/service-provider-dashboard", validateHomeServiceProvider, Service.SeviceProviderDashboard);

    // ServiceProviderDocument
    router.post("/add-edit-service-provider-document", validateHomeServiceProvider, formidableMiddleware(), ServiceProviderDocument.addServiceProof);
    router.get("/get-service-provider-document", validateHomeServiceProvider, ServiceProviderDocument.getServiceProofDetails);
    router.delete("/delete-service-provider-document/:id", validateHomeServiceProvider, ServiceProviderDocument.deleteServiceProof);


    //HomeServiceSeeker
    router.get("/get-service-seeker", validateHomeServiceSeeker, Service.ServiceListSeeker);
    router.get("/get-service-branch-seeker", validateHomeServiceSeeker, Service.ServiceProviderBranchAndServiceListSeeker);
    router.get("/get-service-branch", validateHomeServiceSeeker, Service.serviceProviderBranchSeeker);

    // service request
    router.get("/get-service-request", validateHomeServiceProvider, serviceRequest.ServiceRequestList);
    router.post("/add-service-request", validateHomeServiceSeeker, serviceRequest.AddServiceRequest);
    router.delete("/delete-service-request/:id", validateHomeServiceSeeker, serviceRequest.DeleteServiceRequest);
    router.post("/update-service-request-seeker", validateHomeServiceSeeker, serviceRequest.UpdateServiceRequestSeeker);
    router.post("/update-service-request-provider", validateHomeServiceProvider, serviceRequest.UpdateServiceRequestProvider);
    router.get("/get-service-seeker-request", validateHomeServiceSeeker, serviceRequest.GetRequestesSeeker);

    // ratings for a service
    router.get("/get-rate-service/:id", commonAuth, serviceRequest.GetRateServiceDetailsForService);

    // rate_service_request
    router.post("/add-rate-service-request", validateHomeServiceSeeker, RateServiceRequest.AddRateServiceRequest);
    router.get("/get-rate-service-request", validateHomeServiceSeeker, RateServiceRequest.GetRateServiceRequestList);
    router.delete("/delete-rate-service-request/:id", validateHomeServiceSeeker, RateServiceRequest.DeleteRateServiceRequest);
    router.post("/update-rate-service-request", validateHomeServiceSeeker, RateServiceRequest.UpdateRateServiceRequest);

    // LocalHunarVideos
    router.post("/add-local-hunar-video", validateLocalHunar, formidableMiddleware(), LocalHunarVideos.AddVideo);
    router.get("/get-local-hunar-video", validateLocalHunar, LocalHunarVideos.VideoList);
    router.delete("/delete-local-hunar-video/:id", validateLocalHunar, LocalHunarVideos.DeleteLocalHunarVideo);
    router.get("/add-views-local-hunar-video/:id", validateLocalHunar, LocalHunarVideos.IncrementViews);
    router.post("/edit-local-hunar-video", validateLocalHunar, formidableMiddleware(), LocalHunarVideos.EditVideo);
    router.get("/get-dashboard-details-local-hunar", validateLocalHunar, LocalHunarVideos.dashboardDetails);
    router.get("/get-all-local-hunar-videos", commonAuth, LocalHunarVideos.getAllVideo);

    // notification
    router.get("/get-notification", commonAuth, Notification.NotificationList);
    router.get("/get-unread-notification-count", commonAuth, Notification.UnreadNotificationCount);
    router.delete("/delete-notification", commonAuth, Notification.deleteNotification);

    // MiscellaneousUser
    router.post("/add-miscellaneous-user-personal-details", validateMiscellaneousUser, formidableMiddleware(), MiscellaneousUserController.AddMiscellaneousUserPersonalDetails);
    router.post("/edit-miscellaneous-user-personal-details", validateMiscellaneousUser, formidableMiddleware(), MiscellaneousUserController.EditDetailsMiscellaneousUserPersonalDetails);
    router.get("/get-miscellaneous-user-personal-details", validateApprovedMiscellaneousUser, MiscellaneousUserController.GetDetailsMiscellaneousUserPersonalDetails);
    router.delete("/delete-miscellaneous-user-personal-details", validateMiscellaneousUser, MiscellaneousUserController.DeleteDetailsMiscellaneousUser)


    router.post("/add-miscellaneous-user-current-bussiness-details", validateMiscellaneousUser, formidableMiddleware(), MiscellaneousUserController.AddMiscellaneousUserCurrentBussinessOccupationDetails);
    router.get("/get-miscellaneous-user-bussiness-details", validateMiscellaneousUser, MiscellaneousUserController.GetBussinessDetailsMiscellaneousUser);
    router.delete("/delete-miscellaneous-user-bussiness-details", validateMiscellaneousUser, MiscellaneousUserController.DeleteBussinessDetailsMiscellaneousUser)
    router.post("/add-miscellaneous-user-customer-details", validateMiscellaneousUser, MiscellaneousUserController.AddCustomerDetailsMiscellaneousUser);

    // miscellaneous User insider api's
    router.post("/get-miscellaneous-user-dashboard-details", validateApprovedMiscellaneousUser, MiscellaneousUserController.GetDashboardDetails)
    router.get("/get-miscellaneous-user-registree-details", validateApprovedMiscellaneousUser, MiscellaneousUserController.registreeDetails);
    router.get("/get-miscellaneous-user-commission-details", validateApprovedMiscellaneousUser, MiscellaneousUserController.listOfCommission);


    module.exports = router;