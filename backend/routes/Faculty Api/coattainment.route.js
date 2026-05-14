const express = require('express');
const router = express.Router();
const coattainmentController = require('../../controllers/Faculty/coattainment.controller');
const upload = require('../../middlewares/multer.middleware');

/**
 * GET all subjects with their COs
 */
router.post('/subjects', coattainmentController.getSubjectsWithCOs);

/**
 * GET students for a specific branch and semester
 */
router.post('/students', coattainmentController.getStudentsForAssessment);

/**
 * CREATE a new CO assessment
 */
router.post('/create', coattainmentController.createAssessment);

/**
 * GENERATE Excel template for marks entry
 */
router.post('/template', coattainmentController.generateExcelTemplate);

/**
 * UPLOAD marks from Excel file
 */
router.post('/upload-marks', upload.single('excelFile'), coattainmentController.uploadMarks);

/**
 * GET assessment by ID
 */
router.get('/:assessmentId', coattainmentController.getAssessment);

/**
 * GET all assessments for a faculty
 */
router.post('/list/all', coattainmentController.getFacultyAssessments);

/**
 * CALCULATE and finalize assessment results
 */
router.post('/calculate', coattainmentController.calculateResults);

/**
 * GET assessment summary and statistics
 */
router.get('/:assessmentId/summary', coattainmentController.getAssessmentSummary);

/**
 * EXPORT results to Excel
 */
router.post('/export-results', coattainmentController.exportResults);

/**
 * UPDATE assessment (edit questions and assignments)
 */
router.put('/:assessmentId', coattainmentController.updateAssessment);

/**
 * DELETE assessment
 */
router.delete('/:assessmentId', coattainmentController.deleteAssessment);

module.exports = router;
