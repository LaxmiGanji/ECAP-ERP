const express = require("express");
const router = express.Router();
const { addDetails, getDetails, updateDetails, deleteDetails } = require("../../controllers/Placement/details.controller");

router.post("/addDetails", addDetails);
router.get("/getDetails", getDetails);
router.put("/updateDetails/:id", updateDetails);
router.delete("/deleteDetails/:id", deleteDetails);

module.exports = router;
