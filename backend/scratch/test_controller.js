const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Subject = require("../models/Other/subject.model.js");
const Branch = require("../models/Other/branch.model.js");
const { getCoPoMappings } = require("../controllers/Other/subject.controller.js");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    // Get any subject from DB
    const subject = await Subject.findOne();
    if (!subject) {
      console.log("No subjects found in database!");
      return;
    }
    console.log(`Testing with Subject ID: ${subject._id} (${subject.code})`);

    // Mock Express req and res
    const req = {
      params: {
        subjectId: subject._id.toString()
      }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log(`Response Code: ${this.statusCode || 200}`);
        console.log("Response Data:", JSON.stringify(data, null, 2));
      }
    };

    await getCoPoMappings(req, res);

  } catch (error) {
    console.error("Error running test:", error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
