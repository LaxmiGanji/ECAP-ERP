const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary connection
cloudinary.api.resources_by_tag("test", (error, result) => {
  if (error) {
    console.warn("⚠️  Cloudinary configuration warning:", error.message);
  } else {
    console.log("✅ Cloudinary configured successfully");
  }
});

module.exports = cloudinary;
