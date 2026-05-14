const router = require("express").Router();
const {
  getDetails,
  addDetails,
  deleteDetails,
  getCount,
} = require("../../controllers/Transport/details.controller");

router.post("/getDetails", getDetails);
router.post("/addDetails", addDetails);
router.delete("/deleteDetails/:id", deleteDetails);
router.get("/count", getCount);

module.exports = router;

