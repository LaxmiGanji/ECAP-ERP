// routes/Other/subject.route.js
const express = require("express");
const { 
  getSubject, 
  getSubjectById,
  getSubjectsByBranch, 
  addSubject, 
  deleteSubject, 
  updateSubject, 
  updateSectionTotal, 
  getSectionTotal, 
  incrementSectionTotalByOne,
  addCourseOutcome,
  deleteCourseOutcome,
  updateCoPoMapping,
  getCoPoMappings,
} = require("../../controllers/Other/subject.controller");
const router = express.Router();

// Existing routes
router.get("/getSubject", getSubject);
router.get("/get-all-subjects", getSubject); // Alias for getting all subjects
router.get("/:id", getSubjectById); // Get single subject by ID - MUST be after other specific routes
router.get("/getSubjectsByBranch/:branchId", getSubjectsByBranch);
router.post("/addSubject", addSubject);
router.put("/updateSubject/:id", updateSubject);
router.delete("/deleteSubject/:id", deleteSubject);

// Section total routes
router.get('/getSectionTotal/:subjectId/:section', getSectionTotal);
router.put('/updateSectionTotal/:subjectId', updateSectionTotal); 
router.put("/incrementSectionTotalByOne/:subjectId", incrementSectionTotalByOne);

// Course Outcome routes
router.post("/addCourseOutcome/:subjectId", addCourseOutcome);
router.delete("/deleteCourseOutcome/:subjectId/:coNumber", deleteCourseOutcome);

// CO-PO Mapping routes
router.put("/updateCoPoMapping/:subjectId", updateCoPoMapping);
router.get("/getCoPoMappings/:subjectId", getCoPoMappings);

module.exports = router;