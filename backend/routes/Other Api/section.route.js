// section.route.js
const express = require("express");
const router = express.Router();
const {
  addSection,
  getSections,
  getSectionsByBranchAndSemester,
  updateSection,
  deleteSection,
} = require("../../controllers/Other/section.controller.js");

router.post("/addSection", addSection);
router.get("/getSections", getSections);
router.get("/getSectionsByBranchAndSemester", getSectionsByBranchAndSemester);
router.put("/updateSection/:id", updateSection);
router.delete("/deleteSection/:id", deleteSection);

module.exports = router;
