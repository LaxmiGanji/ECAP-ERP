const mongoose = require("mongoose");

const NewspaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      default: "English",
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly", "Other"],
      default: "Daily",
    },
    vendor: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    copies: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastReceivedOn: {
      type: Date,
    },
    nextIssueDueOn: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Newspaper", NewspaperSchema);

