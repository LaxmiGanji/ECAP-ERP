const { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand 
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, region, isS3Configured } = require("../config/s3.config");
const path = require("path");

/**
 * Sanitize filename for S3 object key
 */
const sanitizeS3Key = (fileName) => {
  if (!fileName) return `file_${Date.now()}`;
  const ext = path.extname(fileName);
  const nameWithoutExt = path.basename(fileName, ext);
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 100);
  return `${sanitized}_${Date.now()}${ext.toLowerCase()}`;
};

/**
 * Upload buffer directly to AWS S3
 * @param {Buffer} fileBuffer 
 * @param {string} originalName 
 * @param {string} mimeType 
 * @param {string} folder 
 * @returns {Promise<{url: string, key: string, bucket: string}>}
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType, folder = "college-cms/files") => {
  if (!isS3Configured || !s3Client) {
    throw new Error("AWS S3 is not configured. Please set AWS environment variables.");
  }

  const key = `${folder}/${sanitizeS3Key(originalName)}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const customDomain = process.env.AWS_CLOUDFRONT_URL;
    const publicUrl = customDomain 
      ? `${customDomain.replace(/\/$/, "")}/${key}`
      : `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    console.log(`✅ File uploaded to S3: ${key}`);
    return {
      url: publicUrl,
      key: key,
      bucket: bucketName,
    };
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw error;
  }
};

/**
 * Delete object from AWS S3 by Key
 * @param {string} key 
 */
const deleteFromS3 = async (key) => {
  if (!isS3Configured || !s3Client) {
    console.warn("⚠️ Cannot delete from S3: AWS S3 is not configured.");
    return null;
  }

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    const result = await s3Client.send(command);
    console.log(`✅ File deleted from S3: ${key}`);
    return result;
  } catch (error) {
    console.error(`❌ Error deleting S3 key ${key}:`, error);
    throw error;
  }
};

/**
 * Generate a pre-signed download URL for private S3 objects (expires in 1 hour)
 * @param {string} key 
 * @param {number} expiresInSeconds 
 */
const getPresignedDownloadUrl = async (key, expiresInSeconds = 3600) => {
  if (!isS3Configured || !s3Client) {
    throw new Error("AWS S3 is not configured.");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getPresignedDownloadUrl,
  sanitizeS3Key,
  isS3Configured,
};
