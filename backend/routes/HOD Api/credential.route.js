const express = require("express");
const router = express.Router();
const { loginHandler, registerHandler, updatePasswordHandler } = require("../../controllers/HOD/credential.controller.js");

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.put("/update", updatePasswordHandler);
router.put("/update/:id", updatePasswordHandler);

module.exports = router;
