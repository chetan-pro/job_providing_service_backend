const router = require('express').Router()
const formidableMiddleware = require('express-formidable')
const { commonAuth ,validateCandidate } = require('../../middlewares/api')
const ResumeController = require('../../controllers/api/ResumeController')

router.get('/show-resume/' , (req,res) => {
    res.render('resume/resume')
})


router.post('/resume-create', validateCandidate ,formidableMiddleware(), ResumeController.create)
router.post('/resume-update/:id', validateCandidate ,formidableMiddleware(), ResumeController.updateResume)
router.delete('/resume-delete/:id', validateCandidate , ResumeController.deleteResume)

router.post('/resume-education-create', validateCandidate, ResumeController.create_education)
router.post('/resume-education-update/:id', validateCandidate, ResumeController.update_education)
router.delete('/resume-education-delete/:id', validateCandidate, ResumeController.delete_education)

router.post('/resume-experience-create', validateCandidate ,ResumeController.create_experience)
router.post('/resume-experience-update/:id', validateCandidate ,ResumeController.update_experience)
router.delete('/resume-experience-delete/:id', validateCandidate ,ResumeController.delete_experience)

router.post('/resume-skills-create', validateCandidate ,ResumeController.create_skills)
router.post('/resume-skills-update/:id', validateCandidate ,ResumeController.update_skills)
router.delete('/resume-skills-delete/:id', validateCandidate ,ResumeController.delete_skills)

router.post('/resume-hobbies-create', validateCandidate ,ResumeController.create_hobbies)
router.post('/resume-hobbies-update/:id', validateCandidate ,ResumeController.update_hobbies)
router.delete('/resume-hobbies-delete/:id', validateCandidate ,ResumeController.delete_hobbies)

router.post('/resume-reference-create', validateCandidate ,ResumeController.create_reference)
router.post('/resume-reference-update/:id', validateCandidate ,ResumeController.update_reference)
router.delete('/resume-reference-delete/:id', validateCandidate ,ResumeController.delete_reference)

router.get('/resume/' ,validateCandidate ,ResumeController.show)
router.get('/resume-html' ,validateCandidate ,ResumeController.resume_html);
router.get('/resume-html-no-auth' ,ResumeController.resume_html_no_Auth);

module.exports = router;
