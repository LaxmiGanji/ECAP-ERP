const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(express.json());

// Import subject route
const subjectRoute = require("../routes/Other Api/subject.route.js");

app.use("/api/subject", subjectRoute);

// Mock a request
async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const Subject = require("../models/Other/subject.model.js");
  const subject = await Subject.findOne();
  const subjectId = subject._id.toString();
  console.log(`Using Subject ID: ${subjectId}`);

  // Start temporary server
  const server = app.listen(5002, async () => {
    console.log("Server listening on port 5002");
    
    const axios = require("axios");
    try {
      const res = await axios.get(`http://localhost:5002/api/subject/getCoPoMappings/${subjectId}`);
      console.log("SUCCESS:", res.status, res.data);
    } catch (e) {
      console.log("FAILED:", e.response ? `${e.response.status} - ${JSON.stringify(e.response.data)}` : e.message);
    }
    
    server.close();
    await mongoose.disconnect();
  });
}

test();
