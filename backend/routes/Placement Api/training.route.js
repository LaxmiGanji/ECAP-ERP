const express = require("express");
const router = express.Router();
const { addTraining, getTrainings, updateTraining, deleteTraining, registerForTraining } = require("../../controllers/Placement/training.controller");

router.post("/add", addTraining);
router.get("/get", getTrainings);
router.put("/update/:id", updateTraining);
router.delete("/delete/:id", deleteTraining);
router.post("/register/:id", registerForTraining);

module.exports = router;
