const express = require("express");
const router = express.Router();
const {
    addApplication,
    getApplicationsForDrive,
    updateApplicationStatus,
    getStudentApplications,
    getApplicationById,
    deleteApplication
} = require("../../controllers/Placement/application.controller");
const { authenticateToken } = require("../../middlewares/auth.middleware"); // Fixed path

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post("/add", addApplication);
router.get("/student/my-applications", getStudentApplications);
router.get("/drive/:driveId", getApplicationsForDrive);
router.get("/:id", getApplicationById);
router.put("/update/:id/status", updateApplicationStatus);
router.delete("/:id", deleteApplication);

module.exports = router;