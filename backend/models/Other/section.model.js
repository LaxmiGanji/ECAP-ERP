// section.model.js
const mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    required: true,
    trim: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    default: 60,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// Ensure section names are unique per branch and semester
SectionSchema.index({ name: 1, branch: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("Section", SectionSchema);
