const express = require("express");
const router = express.Router();
const { addOrUpdateProfile, getProfile } = require("../../controllers/Placement/studentProfile.controller");

// This route handles student-side placement profile management.
router.post("/profile", addOrUpdateProfile);
router.get("/profile", getProfile);

module.exports = router;
