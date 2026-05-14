/**
 * Debug Script: Check MongoDB Data for Credentials
 * 
 * This script helps verify what's stored in MongoDB for all credential collections
 * Run: node backend/scripts/check_credentials.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Import all credential models
const StudentCredential = require("../models/Students/credential.model.js");
const FacultyCredential = require("../models/Faculty/credential.model.js");
const AdminCredential = require("../models/Admin/credential.model.js");
const LibraryCredential = require("../models/Library/credential.model.js");
const TransportCredential = require("../models/Transport/credential.model.js");

const mongoURI = process.env.MONGODB_URI;

const checkCredentials = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Check Students
    console.log("=".repeat(80));
    console.log("📚 STUDENT CREDENTIALS:");
    console.log("=".repeat(80));
    const students = await StudentCredential.find().select("loginid password");
    if (students.length === 0) {
      console.log("❌ No student credentials found");
    } else {
      students.forEach((s, i) => {
        console.log(`${i + 1}. LoginID: ${s.loginid} | Password Hash: ${s.password.substring(0, 20)}...`);
      });
    }

    // Check Faculty
    console.log("\n" + "=".repeat(80));
    console.log("👨‍🏫 FACULTY CREDENTIALS:");
    console.log("=".repeat(80));
    const faculties = await FacultyCredential.find().select("loginid password");
    if (faculties.length === 0) {
      console.log("❌ No faculty credentials found");
    } else {
      faculties.forEach((f, i) => {
        console.log(`${i + 1}. LoginID: ${f.loginid} | Password Hash: ${f.password.substring(0, 20)}...`);
      });
    }

    // Check Admin
    console.log("\n" + "=".repeat(80));
    console.log("🔐 ADMIN CREDENTIALS:");
    console.log("=".repeat(80));
    const admins = await AdminCredential.find().select("loginid password");
    if (admins.length === 0) {
      console.log("❌ No admin credentials found");
    } else {
      admins.forEach((a, i) => {
        console.log(`${i + 1}. LoginID: ${a.loginid} | Password Hash: ${a.password.substring(0, 20)}...`);
      });
    }

    // Check Library
    console.log("\n" + "=".repeat(80));
    console.log("📖 LIBRARY CREDENTIALS:");
    console.log("=".repeat(80));
    const librarians = await LibraryCredential.find().select("loginid password");
    if (librarians.length === 0) {
      console.log("❌ No library credentials found");
    } else {
      librarians.forEach((l, i) => {
        console.log(`${i + 1}. LoginID: ${l.loginid} | Password Hash: ${l.password.substring(0, 20)}...`);
      });
    }

    // Check Transport
    console.log("\n" + "=".repeat(80));
    console.log("🚌 TRANSPORT CREDENTIALS:");
    console.log("=".repeat(80));
    const transports = await TransportCredential.find().select("loginid password");
    if (transports.length === 0) {
      console.log("❌ No transport credentials found");
    } else {
      transports.forEach((t, i) => {
        console.log(`${i + 1}. LoginID: ${t.loginid} | Password Hash: ${t.password.substring(0, 20)}...`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Database check complete!");
    console.log("=".repeat(80));
    console.log("\n📝 NOTES:");
    console.log("   • All passwords should start with '$2b$' (bcrypt hash)");
    console.log("   • If passwords don't start with '$2b$', run migration again");
    console.log("   • If no credentials found, create new ones using Register");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkCredentials();
