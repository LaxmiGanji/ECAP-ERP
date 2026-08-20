const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
  loginid: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

// Auto expire documents when expiresAt is reached
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
