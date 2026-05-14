const express = require("express");
const router = express.Router();
const { addDrive, getDrives, updateDrive, deleteDrive, getEligibleStudents } = require("../../controllers/Placement/drive.controller");

router.post("/add", addDrive);
router.get("/get", getDrives);
router.put("/update/:id", updateDrive);
router.delete("/delete/:id", deleteDrive);
router.get("/eligibleStudents/:id", getEligibleStudents);

module.exports = router;
