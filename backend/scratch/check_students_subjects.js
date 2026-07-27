const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Subject = require("../models/Other/subject.model.js");
const Branch = require("../models/Other/branch.model.js");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    const subjects = await Subject.find().populate('branch', 'name').lean();
    console.log(`Total subjects: ${subjects.length}`);
    
    const subjectsWithCOs = subjects.filter(s => s.courseOutcomes && s.courseOutcomes.length > 0);
    console.log(`Subjects with Course Outcomes: ${subjectsWithCOs.length}`);
    
    if (subjectsWithCOs.length > 0) {
      console.log("First 3 subjects with COs:");
      subjectsWithCOs.slice(0, 3).forEach(s => {
        console.log(`- Code: ${s.code}, COs:`, s.courseOutcomes.map(c => c.coNumber), `Mappings count: ${s.coPoMappings?.length || 0}`);
      });
    }

  } catch (error) {
    console.error("Error checking db:", error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
