/**
 * Script to Create Example Examination User
 *
 * Creates an example examination user with credentials and details
 * Run: node backend/scripts/create_examination_example.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import models
const ExaminationCredential = require("../models/Examination/credential.model.js");
const ExaminationDetails = require("../models/Examination/details.model.js");

const mongoURI = process.env.MONGODB_URI;

const createExaminationExample = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    const employeeId = "exam001";
    const loginid = "exam001";
    const password = "Exam@123";

    // Create Examination Credential
    console.log("🔐 Creating Examination Credential...");
    const existingCredential = await ExaminationCredential.findOne({ loginid });
    if (!existingCredential) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await ExaminationCredential.create({
        loginid,
        password: hashedPassword,
      });
      console.log("✅ Examination Credential created: loginid=exam001, password=Exam@123");
    } else {
      console.log("⏭️  Examination Credential already exists");
    }

    // Create Examination Details
    console.log("\n📝 Creating Examination Details...");
    const existingDetails = await ExaminationDetails.findOne({ employeeId });
    if (!existingDetails) {
      await ExaminationDetails.create({
        employeeId,
        firstName: "John",
        middleName: "A.",
        lastName: "Smith",
        email: "john.smith@college.edu",
        phoneNumber: 9876543210,
        department: "Examination",
        batch: 2024,
        gender: "Male",
        experience: 5,
        post: "Examination Officer",
        panCard: "ABCDE1234F",
        jntuId: "JNTU_EXAM_001",
        aicteId: "AICTE_EXAM_001",
        profile: "default-profile.png"
      });
      console.log("✅ Examination Details created for employeeId=exam001");
    } else {
      console.log("⏭️  Examination Details already exist");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Example Examination User created successfully!\n");

    console.log("📝 LOGIN DETAILS:\n");
    console.log("  Login ID: exam001");
    console.log("  Password: Exam@123");
    console.log("  Role: Examination");
    console.log("\n" + "=".repeat(80));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating example examination user:", error.message);
    process.exit(1);
  }
};

createExaminationExample();