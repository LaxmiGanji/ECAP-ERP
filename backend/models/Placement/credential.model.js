const mongoose = require("mongoose");

const placementCredential = new mongoose.Schema({
  loginid: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Placement Credential", placementCredential);
