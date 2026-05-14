/**
 * Script to Create Test Credentials
 * 
 * Creates sample credentials for all roles with proper bcrypt hashing
 * Run: node backend/scripts/create_test_credentials.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import models
const StudentCredential = require("../models/Students/credential.model.js");
const FacultyCredential = require("../models/Faculty/credential.model.js");
const AdminCredential = require("../models/Admin/credential.model.js");
const ExaminationCredential = require("../models/Examination/credential.model.js");
const LibraryCredential = require("../models/Library/credential.model.js");
const TransportCredential = require("../models/Transport/credential.model.js");

const mongoURI = process.env.MONGODB_URI;

const createTestCredentials = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Create Admin Credential
    console.log("🔐 Creating Admin Credential...");
    const adminExists = await AdminCredential.findOne({ loginid: "admin" });
    if (!adminExists) {
      const adminHash = await bcrypt.hash("Admin@123", 10);
      await AdminCredential.create({
        loginid: "admin",
        password: adminHash,
      });
      console.log("✅ Admin created: loginid=admin, password=Admin@123");
    } else {
      console.log("⏭️  Admin already exists");
    }

    // Create Faculty Credential
    console.log("\n👨‍🏫 Creating Faculty Credential...");
    const facultyExists = await FacultyCredential.findOne({ loginid: "faculty" });
    if (!facultyExists) {
      const facultyHash = await bcrypt.hash("Faculty@123", 10);
      await FacultyCredential.create({
        loginid: "faculty",
        password: facultyHash,
      });
      console.log("✅ Faculty created: loginid=faculty, password=Faculty@123");
    } else {
      console.log("⏭️  Faculty already exists");
    }

    // Create Student Credential
    console.log("\n📚 Creating Student Credential...");
    const studentExists = await StudentCredential.findOne({ loginid: "student" });
    if (!studentExists) {
      const studentHash = await bcrypt.hash("Student@123", 10);
      await StudentCredential.create({
        loginid: "student",
        password: studentHash,
      });
      console.log("✅ Student created: loginid=student, password=Student@123");
    } else {
      console.log("⏭️  Student already exists");
    }

    // Create Library Credential
    console.log("\n📖 Creating Library Credential...");
    const libraryExists = await LibraryCredential.findOne({ loginid: "library" });
    if (!libraryExists) {
      const libraryHash = await bcrypt.hash("Library@123", 10);
      await LibraryCredential.create({
        loginid: "library",
        password: libraryHash,
      });
      console.log("✅ Library created: loginid=library, password=Library@123");
    } else {
      console.log("⏭️  Library already exists");
    }

    // Create Transport Credential
    console.log("\n🚌 Creating Transport Credential...");
    const transportExists = await TransportCredential.findOne({ loginid: "transport" });
    if (!transportExists) {
      const transportHash = await bcrypt.hash("Transport@123", 10);
      await TransportCredential.create({
        loginid: "transport",
        password: transportHash,
      });
      console.log("✅ Transport created: loginid=transport, password=Transport@123");
    } else {
      console.log("⏭️  Transport already exists");
    }

    // Create Examination Credential
    console.log("\n📝 Creating Examination Credential...");
    const examExists = await ExaminationCredential.findOne({ loginid: "examination" });
    if (!examExists) {
      const examHash = await bcrypt.hash("Examination@123", 10);
      await ExaminationCredential.create({
        loginid: "examination",
        password: examHash,
      });
      console.log("✅ Examination created: loginid=examination, password=Examination@123");
    } else {
      console.log("⏭️  Examination already exists");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Test credentials created successfully!\n");

    console.log("📝 USE THESE TO LOGIN:\n");
    console.log("  Admin:     loginid=admin      password=Admin@123");
    console.log("  Faculty:   loginid=faculty    password=Faculty@123");
    console.log("  Student:   loginid=student    password=Student@123");
    console.log("  Library:   loginid=library    password=Library@123");
    console.log("  Transport: loginid=transport  password=Transport@123");
    console.log("  Examination: loginid=examination  password=Examination@123");
    console.log("\n" + "=".repeat(80));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test credentials:", error.message);
    process.exit(1);
  }
};

createTestCredentials();
