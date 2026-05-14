// routes/Other/po.route.js
const express = require("express");
const { initializePOs, getPOs } = require("../../controllers/Other/po.controller");
const router = express.Router();

router.post("/initialize", initializePOs);
router.get("/getPOs", getPOs);

module.exports = router;