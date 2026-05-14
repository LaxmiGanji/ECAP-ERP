const mongoose = require("mongoose");

const transportCredentialSchema = new mongoose.Schema(
  {
    loginid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transport Credential", transportCredentialSchema);

