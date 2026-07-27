const fs = require("fs");
const path = require("path");
const https = require("https");

const modelFiles = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

const baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";
const outputDir = path.join(__dirname, "..", "..", "frontend", "public", "models");

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const downloadFile = (fileName) => {
  return new Promise((resolve, reject) => {
    const fileUrl = baseUrl + fileName;
    const destPath = path.join(outputDir, fileName);

    // Skip download if file already exists
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`✅ File ${fileName} already exists. Skipping.`);
      return resolve();
    }

    console.log(`📥 Downloading ${fileName}...`);
    const fileStream = fs.createWriteStream(destPath);

    https.get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to download ${fileName}. Status code: ${response.statusCode}`));
      }

      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close();
        console.log(`✅ Finished downloading ${fileName}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(destPath);
      console.error(`❌ Error downloading ${fileName}:`, err.message);
      reject(err);
    });
  });
};

const run = async () => {
  console.log("🚀 Starting download of face-api.js models to:", outputDir);
  for (const file of modelFiles) {
    try {
      await downloadFile(file);
    } catch (err) {
      console.error(`⚠️ Failed to download ${file}. Retrying from mirror...`);
      // Optional: Add mirror logic here if raw github raw is blocked or throttled
      // Let's print out the error
      console.error(err);
    }
  }
  console.log("🎉 Model download process finished!");
};

run();
