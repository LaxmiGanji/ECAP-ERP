const { deleteFromS3 } = require("./s3");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary if credentials exist
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Automatically delete a media file from AWS S3 or Cloudinary based on its URL
 * @param {string} fileUrl - Full URL of the file stored in cloud
 */
const deleteCloudFile = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  try {
    // 1. AWS S3 Check
    if (fileUrl.includes('amazonaws.com') || (process.env.AWS_S3_BUCKET_NAME && fileUrl.includes(process.env.AWS_S3_BUCKET_NAME))) {
      const urlObj = new URL(fileUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      if (key) {
        const res = await deleteFromS3(key);
        console.log(`✅ Deleted file from AWS S3: ${key}`);
        return res;
      }
    } 
    // 2. Cloudinary Check
    else if (fileUrl.includes('cloudinary.com')) {
      const urlParts = fileUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      if (publicId) {
        const res = await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted file from Cloudinary: ${publicId}`);
        return res;
      }
    }
  } catch (error) {
    console.error(`⚠️ Cloud file deletion failed for URL '${fileUrl}':`, error.message);
  }
  return null;
};

module.exports = { deleteCloudFile };
