const mongoose = require("mongoose");

const hodCredential = new mongoose.Schema({
  loginid: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("HOD Credential", hodCredential);
