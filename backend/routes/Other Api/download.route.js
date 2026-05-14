const express = require('express');
const router = express.Router();
const { 
  downloadFile, 
  directDownload,
  testCloudinary 
} = require('../../controllers/Other/download.controller.js');

// POST endpoint for download requests (used by frontend)
router.post('/downloadFile', downloadFile);

// GET endpoint for direct downloads (simpler alternative)
router.get('/direct-download', directDownload);

// Test endpoint to verify Cloudinary setup
router.get('/test-cloudinary', testCloudinary);

module.exports = router;