require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const PrincipalCredential = require("../models/Principal/credential.model.js");

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/ECAP";

const createPrincipal = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    const principalExists = await PrincipalCredential.findOne({ loginid: "principal" });
    if (!principalExists) {
      const hashedPassword = await bcrypt.hash("Principal@123", 10);
      await PrincipalCredential.create({
        loginid: "principal",
        password: hashedPassword,
      });
      console.log("\n" + "=".repeat(50));
      console.log("✅ Principal Account Created Successfully!");
      console.log("   LoginID:  principal");
      console.log("   Password: Principal@123");
      console.log("=".repeat(50) + "\n");
    } else {
      console.log("⏭️  Principal already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createPrincipal();
