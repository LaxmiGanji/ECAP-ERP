const express = require("express");
const router = express.Router();
const {
  moveToDetainStudents,
  getDetainedStudents,
  restoreDetainedStudent
} = require("../../controllers/Student/detainStudent.controller.js");

// Routes
router.post("/detain", moveToDetainStudents);
router.get("/detained", getDetainedStudents);
router.post("/restore/:detainId", restoreDetainedStudent);

module.exports = router;