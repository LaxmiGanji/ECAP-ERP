const express = require("express");
const { getMarks, addMarks, deleteMarks, getMarksByEnrollments } = require("../../controllers/Other/marks.controller");
const router = express.Router();

router.post("/getMarks", getMarks);
router.post("/addMarks", addMarks);
router.delete("/deleteMarks/:id", deleteMarks);
router.post("/getMarksByEnrollments", getMarksByEnrollments);

module.exports = router;
