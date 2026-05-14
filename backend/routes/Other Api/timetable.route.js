//timetable.route.js
require("dotenv").config();
const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/multer.middleware.js");
const { getTimetable, addTimetable, deleteTimetable, editTimetable } = require("../../controllers/Other/timetable.controller.js");

router.post("/getTimetable", getTimetable);
router.post("/addTimetable", addTimetable);
router.delete("/deleteTimetable/:id", deleteTimetable);
// Add this route
router.put("/editTimetable/:id", editTimetable);

module.exports = router;
