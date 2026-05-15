// routes/Faculty Api/details.route.js
const express = require("express");
const router = express.Router();
const { 
  getDetails, 
  getDetails2,
  addDetails, 
  updateDetails, 
  deleteDetails, 
  getCount, 
  updateTimetable, 
  getFacultyByBatchAndBranch,
  validateTimetable,
  getFacultyWithFreePeriods,
  substituteFaculty,
  updateSubstitutionStatus,
  undoSubstitution,
  resetTimetable,
  getSubstitutionHistory
} = require("../../controllers/Faculty/details.controller.js");
const upload = require("../../middlewares/multer.middleware.js");
const facultyDetails = require("../../models/Faculty/details.model.js");
const coattainmentRoutes = require("./coattainment.route.js");


const handleMultiPart = (req, res, next) => {
  if (req.headers['content-type'] && 
      req.headers['content-type'].includes('multipart/form-data')) {
    return upload.single('profile')(req, res, next);
  }
  express.json()(req, res, next);
};

router.post("/getDetails", getDetails);

router.get("/getDetails2", getDetails2);

router.post("/addDetails", handleMultiPart, addDetails);

router.put("/updateDetails/:id", upload.single("profile"), updateDetails);

router.delete("/deleteDetails/:id", deleteDetails);

router.get("/count", getCount);

router.put("/updateTimetable/:id", updateTimetable);

router.post("/validateTimetable", validateTimetable);

router.get("/reports/byBatchBranch", getFacultyByBatchAndBranch);

// Substitution routes
router.get("/faculty-with-free-periods", getFacultyWithFreePeriods);
router.post("/substitute", substituteFaculty);
router.post("/update-status", updateSubstitutionStatus);
router.post("/undo-substitution", undoSubstitution);
router.post("/reset-timetable", resetTimetable);
router.get("/substitution-history/:facultyId", getSubstitutionHistory);

// CO Attainment routes
router.use("/coattainment", coattainmentRoutes);

module.exports = router;