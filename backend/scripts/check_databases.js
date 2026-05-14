/**
 * Debug Script: Check All MongoDB Databases for Credentials
 * Shows all collections and their contents
 */

require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

const checkAllDatabases = async () => {
  try {
    // First connect to check databases
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Get current database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Current Database: ${dbName}`);
    console.log("=".repeat(80));

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📁 Collections in this database:");
    
    if (collections.length === 0) {
      console.log("❌ No collections found");
    } else {
      for (const collection of collections) {
        const collName = collection.name;
        const count = await mongoose.connection.db.collection(collName).countDocuments();
        console.log(`   • ${collName}: ${count} documents`);
        
        // Show sample data
        if (count > 0) {
          const sampleDocs = await mongoose.connection.db.collection(collName).find({}).limit(2).toArray();
          sampleDocs.forEach((doc, idx) => {
            console.log(`      [${idx + 1}] ${JSON.stringify(doc).substring(0, 100)}...`);
          });
        }
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Database check complete!");
    
    console.log("\n🔍 EXPECTED COLLECTIONS:");
    console.log("   • student credentials (Students)");
    console.log("   • faculty credentials (Faculties)");
    console.log("   • admin credentials (Admin Credentials)");
    console.log("   • library credentials (Library Credentials)");
    console.log("   • transport credentials (Transport Credentials)");
    
    console.log("\n⚠️  If collections are empty:");
    console.log("   1. Check MongoDB Atlas console at https://cloud.mongodb.com");
    console.log("   2. Verify you're looking at the right cluster");
    console.log("   3. Create credentials by using Register in the app");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkAllDatabases();
