const express = require("express");
const router = express.Router();
const {
  getBranchFaculty,
  getBranchStudents,
  getBranchNotices
} = require("../../controllers/HOD/management.controller.js");

router.get("/faculty/:branch", getBranchFaculty);
router.get("/students/:branch", getBranchStudents);
router.get("/notices/:branch", getBranchNotices);

module.exports = router;
