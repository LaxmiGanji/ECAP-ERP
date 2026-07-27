const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Subject = require("../models/Other/subject.model.js");
const Branch = require("../models/Other/branch.model.js");
const coattainmentService = require("../services/coattainment.service.js");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    const subject = await Subject.findOne({ code: "CS702PC" });
    if (!subject) {
      console.log("Subject CS702PC not found!");
      return;
    }

    console.log("Subject course outcomes:", subject.courseOutcomes);
    console.log("Initial coPoMappings count:", subject.coPoMappings.length);

    // Replicate updateCoPoMapping logic
    const coNumber = "CO1";
    const poNumber = "PO1";
    const strength = 2; // Medium

    // Remove existing mapping
    subject.coPoMappings = subject.coPoMappings.filter(
        mapping => !(
            mapping.coNumber.toUpperCase() === coNumber.toUpperCase() && 
            mapping.poNumber.toUpperCase() === poNumber.toUpperCase()
        )
    );

    // Add new mapping
    subject.coPoMappings.push({
        coNumber: coNumber.toUpperCase(),
        poNumber: poNumber.toUpperCase(),
        strength: Number(strength)
    });

    await subject.save();
    console.log("Subject saved successfully!");

    // Recalculate PO attainments based on new mapping
    const updatedSubject = await Subject.findById(subject._id);
    const poAttainments = await coattainmentService.calculatePOAttainments(updatedSubject);
    console.log("Recalculated PO attainments:", poAttainments);

  } catch (error) {
    console.error("Error updating mapping:", error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
