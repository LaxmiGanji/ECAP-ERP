const mongoose = require("mongoose");

const substitutionSchema = new mongoose.Schema({
  originalFacultyId: {
    type: String,
    required: true,
    index: true
  },
  substituteFacultyId: {
    type: String,
    required: true,
    index: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  periodNumber: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  // Store the substitute faculty's original period data BEFORE substitution
  substituteOriginalPeriod: {
    subject: { type: String },
    branch: { type: String },
    semester: { type: String },
    section: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    isSpecialPeriod: { type: Boolean, default: false }
  },
  substitutionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'pending', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Compound index for quick lookups
substitutionSchema.index({ originalFacultyId: 1, day: 1, periodNumber: 1 });
substitutionSchema.index({ substituteFacultyId: 1, day: 1, periodNumber: 1 });
substitutionSchema.index({ status: 1 });

module.exports = mongoose.model("Substitution", substitutionSchema);