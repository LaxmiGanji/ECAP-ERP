const { S3Client } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION || "ap-south-1"; // Default to Asia Pacific (Mumbai)
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

let s3Client = null;
let isS3Configured = false;

if (accessKeyId && secretAccessKey && bucketName) {
  s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
  isS3Configured = true;
  console.log(`✅ AWS S3 Client initialized (Bucket: ${bucketName}, Region: ${region})`);
} else {
  console.warn("⚠️ AWS S3 credentials not fully configured in environment variables.");
}

module.exports = {
  s3Client,
  isS3Configured,
  bucketName,
  region,
};
