const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const { isS3Configured } = require("../config/s3.config");
const { uploadToS3 } = require("../utils/s3");

// Configure Cloudinary with verification (fallback option)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (isS3Configured) {
  console.log("✅ AWS S3 configured as PRIMARY storage provider for multer");
} else {
  console.log("ℹ️ Cloudinary configured as storage provider for multer (AWS S3 credentials missing)");
}

// Helper function to sanitize file names
const sanitizeFileName = (fileName) => {
  if (!fileName) return `file_${Date.now()}`;
  
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // Replace special characters with underscores
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100); // Limit length
  
  return sanitized || `file_${Date.now()}`;
};

// Helper to get file extension
const getFileExtension = (fileName) => {
  return path.extname(fileName || '').toLowerCase();
};

// Determine target folder based on request type
const getTargetFolder = (req) => {
  let folder = "college-cms/files";
  if (req.body?.type === "material") {
    folder = "college-cms/materials";
  } else if (req.body?.type === "profile") {
    folder = "college-cms/profiles";
  } else if (req.body?.type === "certification") {
    folder = "college-cms/certifications";
  } else if (req.body?.type === "notice") {
    folder = "college-cms/notices";
  } else if (req.body?.type === "newspaper") {
    folder = "college-cms/newspapers";
  } else if (req.body?.type === "timetable") {
    folder = "college-cms/timetables";
  }
  return folder;
};

// Cloudinary Storage Engine Configuration
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = getTargetFolder(req);
    let resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
    let originalFilename = sanitizeFileName(file.originalname);
    let publicId = `${originalFilename}_${Date.now()}`;
    
    return {
      folder: folder,
      public_id: publicId,
      resource_type: resourceType,
      access_mode: 'public',
      type: 'upload',
      unique_filename: true,
      overwrite: false,
    };
  },
});

// File filter to allow common file types
const fileFilter = (req, file, cb) => {
  console.log(`🔍 File filter - Name: ${file.originalname}, MIME: ${file.mimetype}`);
  
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    
    // Documents
    "application/pdf",
    
    // Microsoft Office
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    
    // Text files
    "text/plain",
    "text/csv",
    "text/html",
    
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    
    // Other common types
    "application/json",
    "application/xml",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed. Please upload images, PDFs, or Office documents.`), false);
  }
};

// Use memoryStorage if S3 is active, else use CloudinaryStorage
const storage = isS3Configured ? multer.memoryStorage() : cloudinaryStorage;

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter
});

// Wrapper middleware for single file upload with S3 processing
const uploadMiddleware = (req, res, next) => {
  console.log('\n🚀 === UPLOAD MIDDLEWARE STARTED ===');
  
  upload.single("material")(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer upload error:", err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: "File too large. Maximum size is 100MB." 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Upload error occurred' 
      });
    }

    if (req.file) {
      try {
        if (isS3Configured && req.file.buffer) {
          console.log(`📤 Uploading file to AWS S3: ${req.file.originalname}`);
          const folder = getTargetFolder(req);
          const s3Result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
          
          // Attach S3 details to req.file so controllers remain standard
          req.file.path = s3Result.url;
          req.file.secure_url = s3Result.url;
          req.file.url = s3Result.url;
          req.file.key = s3Result.key;
          req.file.filename = s3Result.key;
          req.file.public_id = s3Result.key;
          
          console.log("🎉 === FILE UPLOADED TO AWS S3 SUCCESSFULLY ===");
          console.log("S3 URL:", req.file.path);
        } else {
          console.log("🎉 === FILE UPLOADED TO CLOUDINARY SUCCESSFULLY ===");
          console.log("Cloudinary URL:", req.file.path);
        }
      } catch (uploadError) {
        console.error("❌ Error processing storage upload:", uploadError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to upload file to cloud storage",
          details: uploadError.message
        });
      }
    } else {
      console.log("⚠️ No file in request.");
    }

    next();
  });
};

// Multiple file upload middleware
const uploadMultipleMiddleware = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        console.error("❌ Multiple upload error:", err.message);
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Upload error' 
        });
      }
      
      if (req.files && req.files.length > 0 && isS3Configured) {
        try {
          const folder = getTargetFolder(req);
          for (let file of req.files) {
            if (file.buffer) {
              const s3Result = await uploadToS3(file.buffer, file.originalname, file.mimetype, folder);
              file.path = s3Result.url;
              file.secure_url = s3Result.url;
              file.url = s3Result.url;
              file.key = s3Result.key;
              file.filename = s3Result.key;
            }
          }
          console.log(`✅ Uploaded ${req.files.length} files to AWS S3`);
        } catch (s3Err) {
          console.error("❌ Multiple S3 upload failed:", s3Err);
          return res.status(500).json({ success: false, message: "S3 multi-upload failed" });
        }
      }
      
      next();
    });
  };
};

module.exports = upload;
module.exports.uploadMiddleware = uploadMiddleware;
module.exports.uploadMultipleMiddleware = uploadMultipleMiddleware;
module.exports.cloudinary = cloudinary;