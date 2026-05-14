const mongoose = require("mongoose");

const Library = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    bookCode: {
      type: Number,
      required: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      default: "General",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    rackNumber: {
      type: String,
      trim: true,
      default: "",
    },
    publisher: {
      type: String,
      trim: true,
    },
    publishedYear: {
      type: Number,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    issuedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Library", Library);
