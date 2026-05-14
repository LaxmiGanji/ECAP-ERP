const mongoose = require("mongoose");

const placementDriveSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Placement Company",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  driveDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  venue: {
    type: String,
  },
  mode: {
    type: String,
    enum: ["Online", "Offline", "Hybrid"],
    default: "Offline",
  },
  description: {
    type: String,
  },
  eligibilityCriteria: {
    minCGPA: {
      type: Number,
      default: 0,
    },
    maxBacklogs: {
      type: Number,
      default: 0,
    },
    allowedBranches: [{
      type: String,
    }],
    min10thPercentage: {
      type: Number,
      default: 0,
    },
    min12thPercentage: {
      type: Number,
      default: 0,
    }
  },
  packageDetails: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
    default: "Upcoming",
  }
}, { timestamps: true });

module.exports = mongoose.model("Placement Drive", placementDriveSchema);
