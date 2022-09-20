const router = require('express').Router()
const { validateCompanyOrStaff, validateCompany } = require('../../middlewares/api')
const StaffController = require('../../controllers/api/staffControllers')

// staff
router.get("/get-staff-permissions", validateCompany, StaffController.getStaffPermissions);
router.get("/get-staff", validateCompany, StaffController.getStaff);
router.post("/add-staff", validateCompany, StaffController.addStaff);
router.post("/edit-staff", validateCompanyOrStaff, StaffController.editStaff);
// router.post("/change-staff-password", validateCompany, StaffController.getStaff);
router.delete("/delete-staff/:id", validateCompany, StaffController.deleteStaff);
router.post("/active-inactive-staff", validateCompany, StaffController.activeInActiveStaff);

module.exports = router;