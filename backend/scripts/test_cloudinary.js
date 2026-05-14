require("dotenv").config();
const cloudinary = require("cloudinary").v2;

console.log("🔧 Cloudinary Configuration:");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Not set");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not set");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not set");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("\n🧪 Testing Cloudinary connection...");
cloudinary.api.resources(
  { max_results: 1 },
  (error, result) => {
    if (error) {
      console.error("❌ Cloudinary Error:", error.message);
    } else {
      console.log("✅ Cloudinary Connected Successfully");
      console.log("Total resources:", result.total_count);
    }
  }
);
