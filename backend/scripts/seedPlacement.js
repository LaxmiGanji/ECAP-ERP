const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const placementCredential = require('../models/Placement/credential.model');
const placementDetails = require('../models/Placement/details.model');

require('dotenv').config({ path: '.env' }); 

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ECAP", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("Connected to MongoDB");

  const loginid = "placement123";
  const password = "password123";
  const employeeId = 9999;

  try {
    // 1. Create Credential
    const existingCred = await placementCredential.findOne({ loginid });
    if (existingCred) {
        console.log("Placement credential already exists! Updating password just in case.");
        const hashedPassword = await bcrypt.hash(password, 10);
        existingCred.password = hashedPassword;
        await existingCred.save();
        console.log("Password updated.");
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await placementCredential.create({
            loginid,
            password: hashedPassword
        });
        console.log(`Created credential with loginid: ${loginid}`);
    }

    // 2. Create Details
    const existingDetails = await placementDetails.findOne({ employeeId });
    if (existingDetails) {
        console.log("Placement details already exist!");
    } else {
        await placementDetails.create({
            employeeId: employeeId,
            firstName: "Placement",
            lastName: "Officer",
            email: "placement@college.edu",
            phoneNumber: 1234567890,
            designation: "Head of Placements"
        });
        console.log(`Created details for employeeId: ${employeeId}`);
    }

  } catch (err) {
      console.error(err);
  } finally {
      mongoose.disconnect();
  }
}).catch(err => {
  console.error("DB connection error:", err);
});
