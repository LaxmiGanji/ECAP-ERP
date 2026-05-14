const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete file from Cloudinary by public ID
 * @param {string} publicId - The public ID of the file in Cloudinary
 * @returns {Promise}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("✅ File deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("❌ Error deleting file from Cloudinary:", error);
    throw error;
  }
};

/**
 * Get file URL from Cloudinary
 * @param {string} publicId - The public ID of the file
 * @returns {string} - Cloudinary URL
 */
const getCloudinaryUrl = (publicId) => {
  return cloudinary.url(publicId, { secure: true });
};

/**
 * Delete multiple files from Cloudinary
 * @param {array} publicIds - Array of public IDs
 * @returns {Promise}
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const results = await Promise.all(
      publicIds.map((id) => cloudinary.uploader.destroy(id))
    );
    console.log("✅ Multiple files deleted from Cloudinary");
    return results;
  } catch (error) {
    console.error("❌ Error deleting multiple files:", error);
    throw error;
  }
};

module.exports = {
  deleteFromCloudinary,
  getCloudinaryUrl,
  deleteMultipleFromCloudinary,
};
