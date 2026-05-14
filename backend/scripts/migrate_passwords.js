/**
 * Migration Script: Hash All Existing Passwords in MongoDB
 * 
 * Run this script ONCE to convert all plain text passwords to hashed passwords
 * Command: node backend/scripts/migrate_passwords.js
 * 
 * This is needed because your existing MongoDB data has plain text passwords,
 * but the new authentication system uses bcrypt hashing.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import all credential models
const StudentCredential = require("../models/Students/credential.model.js");
const FacultyCredential = require("../models/Faculty/credential.model.js");
const AdminCredential = require("../models/Admin/credential.model.js");
const LibraryCredential = require("../models/Library/credential.model.js");
const TransportCredential = require("../models/Transport/credential.model.js");

const mongoURI = process.env.MONGODB_URI;

const hashExistingPasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Hash Student Credentials
    console.log("\n🔄 Hashing Student Credentials...");
    const students = await StudentCredential.find();
    for (const student of students) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2x$)
      if (!student.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(student.password, 10);
        student.password = hashedPassword;
        await student.save();
        console.log(`✅ Hashed password for student: ${student.loginid}`);
      } else {
        console.log(`⏭️  Skipped (already hashed): ${student.loginid}`);
      }
    }

    // Hash Faculty Credentials
    console.log("\n🔄 Hashing Faculty Credentials...");
    const faculties = await FacultyCredential.find();
    for (const faculty of faculties) {
      if (!faculty.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(faculty.password, 10);
        faculty.password = hashedPassword;
        await faculty.save();
        console.log(`✅ Hashed password for faculty: ${faculty.loginid}`);
      } else {
        console.log(`⏭️  Skipped (already hashed): ${faculty.loginid}`);
      }
    }

    // Hash Admin Credentials
    console.log("\n🔄 Hashing Admin Credentials...");
    const admins = await AdminCredential.find();
    for (const admin of admins) {
      if (!admin.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        admin.password = hashedPassword;
        await admin.save();
        console.log(`✅ Hashed password for admin: ${admin.loginid}`);
      } else {
        console.log(`⏭️  Skipped (already hashed): ${admin.loginid}`);
      }
    }

    // Hash Library Credentials
    console.log("\n🔄 Hashing Library Credentials...");
    const librarians = await LibraryCredential.find();
    for (const librarian of librarians) {
      if (!librarian.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(librarian.password, 10);
        librarian.password = hashedPassword;
        await librarian.save();
        console.log(`✅ Hashed password for librarian: ${librarian.loginid}`);
      } else {
        console.log(`⏭️  Skipped (already hashed): ${librarian.loginid}`);
      }
    }

    // Hash Transport Credentials
    console.log("\n🔄 Hashing Transport Credentials...");
    const transports = await TransportCredential.find();
    for (const transport of transports) {
      if (!transport.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(transport.password, 10);
        transport.password = hashedPassword;
        await transport.save();
        console.log(`✅ Hashed password for transport: ${transport.loginid}`);
      } else {
        console.log(`⏭️  Skipped (already hashed): ${transport.loginid}`);
      }
    }

    console.log("\n✅ Password migration completed successfully!");
    console.log("🔐 All passwords are now securely hashed with bcrypt");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
};

// Run the migration
hashExistingPasswords();
