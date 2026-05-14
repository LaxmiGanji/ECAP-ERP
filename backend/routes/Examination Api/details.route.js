// routes/Examination Api/details.route.js
const express = require("express");
const router = express.Router();
const {
  getDetails,
  addDetails,
  updateDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Examination/details.controller.js");
const upload = require("../../middlewares/multer.middleware.js");  // Changed from upload.js to multer.middleware.js

router.post("/getDetails", getDetails);
router.post("/addDetails", upload.uploadMiddleware, addDetails);
router.put("/updateDetails/:id", updateDetails);
router.delete("/deleteDetails/:id", deleteDetails);
router.get("/count", getCount);

module.exports = router;