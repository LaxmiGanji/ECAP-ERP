const mongoose = require("mongoose");

const trainingSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  venue: {
    type: String,
  },
  trainerName: {
    type: String,
  },
  type: {
    type: String,
    enum: ["Aptitude", "Coding", "Soft Skills", "Mock Interview", "Other"],
    default: "Other",
  },
  materialLinks: [{
    title: String,
    link: String
  }],
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student Credential"
  }]
}, { timestamps: true });

module.exports = mongoose.model("Placement Training", trainingSessionSchema);
