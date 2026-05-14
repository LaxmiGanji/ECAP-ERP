const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },
  contactPerson: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  contactPhone: {
    type: String,
  },
  address: {
    type: String,
  },
  industryType: {
    type: String,
  },
  description: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Placement Company", companySchema);
