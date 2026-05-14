const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcrypt");

const adminCredentialSchema = new mongoose.Schema({
  loginid: String,
  password: String,
});

const AdminCredential = mongoose.model("AdminCredential", adminCredentialSchema, "admincredentials");

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const admin = await AdminCredential.findOne({ loginid: "987654" });

    if (!admin) {
      console.log("❌ Admin with loginid 987654 not found");
      return;
    }

    console.log("\n📋 Admin Found:");
    console.log("LoginID:", admin.loginid);
    console.log("Password Hash:", admin.password);
    console.log("Password Length:", admin.password?.length);

    // Test password comparison
    const testPassword = "Laxmi@123";
    if (admin.password.startsWith("$2")) {
      // It's a bcrypt hash
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log("\n🔐 Password Verification:");
      console.log(`Testing password "${testPassword}": ${isValid ? "✅ VALID" : "❌ INVALID"}`);
    } else {
      console.log("\n⚠️  Password is NOT hashed (plain text)");
      console.log(`Testing plain text match: ${admin.password === testPassword ? "✅ MATCHES" : "❌ NO MATCH"}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
};

checkAdmin();
