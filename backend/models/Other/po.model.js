// models/Other/po.model.js
const mongoose = require("mongoose");

const poSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    enum: ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("PO", poSchema);