const mongoose = require("mongoose");

const alumniCredentialSchema = new mongoose.Schema({
  loginid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  enrollmentNo: {
    type: String,
    required: true,
    trim: true
  },
  graduationYear: {
    type: String,
    trim: true
  },
  graduatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Alumni Credential", alumniCredentialSchema);
