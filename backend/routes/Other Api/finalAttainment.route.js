const express = require('express');
const router = express.Router();
const multer = require('multer');
const finalAttainmentController = require('../../controllers/Other/finalAttainment.controller');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route to generate template (now POST to accept questions data)
router.post('/template', finalAttainmentController.generateTemplate);

// Route to upload filled template and calculate
router.post('/upload', upload.fields([{ name: 'iaFile', maxCount: 1 }, { name: 'seeFile', maxCount: 1 }]), finalAttainmentController.uploadAndCalculate);

// Route to export final results in Excel
router.post('/export', upload.fields([{ name: 'iaFile', maxCount: 1 }, { name: 'seeFile', maxCount: 1 }]), finalAttainmentController.exportWithResults);

module.exports = router;
