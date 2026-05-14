const mongoose = require("mongoose");
require("dotenv").config();

const testMaterialUpload = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected successfully");

    const materialSchema = new mongoose.Schema({
      faculty: { type: String, required: true },
      subject: { type: String, required: true },
      title: { type: String, required: true },
      link: { type: String, required: true }
    }, { timestamps: true });

    const Material = mongoose.model("Material", materialSchema);

    console.log("\n📝 Testing material creation...");
    const testMaterial = await Material.create({
      faculty: "Test Faculty",
      subject: "Test Subject",
      title: "Test Title",
      link: "https://res.cloudinary.com/test/image/upload/test.pdf"
    });

    console.log("✅ Material created successfully:");
    console.log(testMaterial);

    // Clean up
    await Material.deleteOne({ _id: testMaterial._id });
    console.log("✅ Test material deleted");

    await mongoose.connection.close();
    console.log("✅ Connection closed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
};

testMaterialUpload();
