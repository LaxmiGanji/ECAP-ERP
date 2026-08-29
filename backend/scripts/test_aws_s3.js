require("dotenv").config();
const { isS3Configured, bucketName, region } = require("../config/s3.config");
const { uploadToS3, deleteFromS3 } = require("../utils/s3");

async function runAwsS3Test() {
  console.log("=========================================");
  console.log("🚀 TESTING AWS S3 INTEGRATION");
  console.log("=========================================");

  if (!isS3Configured) {
    console.log("❌ AWS S3 is NOT configured in backend/.env!");
    console.log("Please ensure the following environment variables are set in backend/.env:");
    console.log("  AWS_REGION=ap-south-1");
    console.log("  AWS_ACCESS_KEY_ID=your_access_key");
    console.log("  AWS_SECRET_ACCESS_KEY=your_secret_key");
    console.log("  AWS_S3_BUCKET_NAME=your_bucket_name");
    return;
  }

  console.log(`✅ Configuration Detected:`);
  console.log(`   - Bucket: ${bucketName}`);
  console.log(`   - Region: ${region}`);
  console.log("-----------------------------------------");

  try {
    // 1. Create a dummy test buffer
    const testContent = `AWS S3 Upload Test - ECAP ERP System - ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent, "utf-8");
    const testFilename = `test_file_${Date.now()}.txt`;

    console.log(`📤 Uploading test file '${testFilename}' to AWS S3...`);
    const uploadResult = await uploadToS3(testBuffer, testFilename, "text/plain", "college-cms/test");

    console.log("\n🎉 UPLOAD SUCCESSFUL!");
    console.log("   - S3 Public URL:", uploadResult.url);
    console.log("   - S3 Object Key:", uploadResult.key);
    console.log("   - Bucket Name:  ", uploadResult.bucket);

    console.log("\n=========================================");
    console.log("✅ AWS S3 IS FULLY WORKING AND PROPERLY CONFIGURED!");
    console.log("=========================================");
  } catch (error) {
    console.error("\n❌ AWS S3 UPLOAD FAILED!");
    console.error("Error Code:   ", error.code || error.name);
    console.error("Error Message:", error.message);
    console.log("-----------------------------------------");
    console.log("Common fixes:");
    console.log("1. Verify your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
    console.log("2. Ensure the S3 Bucket exists in AWS Console.");
    console.log("3. Ensure the bucket has 'Block Public Access' turned OFF and Bucket Policy allows s3:GetObject.");
  }
}

runAwsS3Test();
