const express = require("express");
const router = express.Router();
const {
  getBatchPredictiveRisk,
  getPlacementReadinessPrediction,
} = require("../../controllers/Other/predictive.controller");

router.get("/batch-risk", getBatchPredictiveRisk);
router.get("/placement-readiness", getPlacementReadinessPrediction);

module.exports = router;
