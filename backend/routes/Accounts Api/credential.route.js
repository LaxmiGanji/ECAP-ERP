const express = require("express");
const router = express.Router();
const { loginHandler, registerHandler } = require("../../controllers/Accounts/credential.controller.js");

router.post("/login", loginHandler);
router.post("/register", registerHandler);

module.exports = router;
