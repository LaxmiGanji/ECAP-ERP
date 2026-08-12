const express = require("express");
const router = express.Router();
const { loginHandler } = require("../../controllers/Alumni/credential.controller.js");

router.post("/login", loginHandler);

module.exports = router;
