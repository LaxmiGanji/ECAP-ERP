const mongoose = require("mongoose");

const examinationCredential = new mongoose.Schema({
  loginid: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Examination Credential", examinationCredential);
