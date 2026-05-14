const express = require("express");
const router = express.Router();
const { loginHandler, registerHandler } = require("../../controllers/Principal/credential.controller.js");

router.post("/login", loginHandler);
router.post("/register", registerHandler);

module.exports = router;
