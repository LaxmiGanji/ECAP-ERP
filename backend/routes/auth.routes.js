const express = require("express");
const router = express.Router();
const { googleLogin } = require("../controllers/googleAuth.controller");
const {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
} = require("../controllers/forgotPassword.controller");

router.post("/google-login", googleLogin);
router.post("/forgot-password", requestPasswordReset);
router.post("/forgot-password-request", requestPasswordReset);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

module.exports = router;

