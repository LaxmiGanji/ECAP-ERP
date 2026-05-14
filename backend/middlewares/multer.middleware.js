const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// Configure Cloudinary with verification
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("✅ Cloudinary configured for multer with cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);

// Verify Cloudinary connection
cloudinary.api.ping()
  .then(result => console.log("✅ Cloudinary connection verified:", result.status === 'ok' ? 'OK' : result))
  .catch(err => console.warn("⚠️ Cloudinary connection check failed:", err.message));

// Helper function to sanitize file names for Cloudinary
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

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log(`📁 Processing file: ${file.originalname}, Type: ${file.mimetype}`);
    
    let folder = "college-cms/files";
    let resourceType = 'auto';
    let originalFilename = sanitizeFileName(file.originalname);
    let publicId = `${originalFilename}_${Date.now()}`;
    
    // Determine resource type based on file mime type
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.includes('pdf')) {
      resourceType = 'raw';
    } else if (file.mimetype.includes('word') || file.mimetype.includes('document')) {
      resourceType = 'raw';
    } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
      resourceType = 'raw';
    } else if (file.mimetype.includes('text') || file.mimetype.includes('plain')) {
      resourceType = 'raw';
    } else if (file.mimetype.includes('zip') || file.mimetype.includes('compressed')) {
      resourceType = 'raw';
    } else {
      resourceType = 'raw'; // Default to raw for downloads
    }
    
    // Organize files by type in Cloudinary folders
    if (req.body?.type === "material") {
      folder = "college-cms/materials";
      const subject = sanitizeFileName(req.body.subject || 'UnknownSubject');
      const title = sanitizeFileName(req.body.title || 'Material');
      publicId = `Material_${subject}_${title}_${Date.now()}`;
      console.log(`📚 Material upload - Folder: ${folder}, PublicId: ${publicId}`);
    } else if (req.body?.type === "profile") {
      folder = "college-cms/profiles";
      publicId = `Profile_${Date.now()}`;
      resourceType = 'image';
    } else if (req.body?.type === "certification") {
      folder = "college-cms/certifications";
      publicId = `Certification_${Date.now()}`;
    } else if (req.body?.type === "notice") {
      folder = "college-cms/notices";
      publicId = `Notice_${Date.now()}`;
    } else if (req.body?.type === "newspaper") {
      folder = "college-cms/newspapers";
      publicId = `Newspaper_${Date.now()}`;
    } else if (req.body?.type === "timetable") {
      folder = "college-cms/timetables";
      publicId = `Timetable_${Date.now()}`;
    }
    
    // Prepare transformation for better downloads
    const transformation = [];
    if (resourceType === 'raw') {
      // Add flags for raw files to ensure they're downloadable
      transformation.push({ flags: 'attachment' });
    }
    
    console.log(`📤 Cloudinary params - Folder: ${folder}, PublicId: ${publicId}, ResourceType: ${resourceType}`);
    
    return {
      folder: folder,
      public_id: publicId,
      resource_type: resourceType,
      access_mode: 'public', // CRITICAL: Make files publicly accessible
      type: 'upload',
      transformation: transformation.length > 0 ? transformation : undefined,
      format: getFileExtension(file.originalname).replace('.', '') || undefined,
      // Add timestamp to URL to prevent caching issues
      unique_filename: true,
      overwrite: false,
      invalidate: true
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
    console.log("✅ File type allowed");
    cb(null, true);
  } else {
    console.log(`❌ File type rejected: ${file.mimetype}`);
    cb(new Error(`File type '${file.mimetype}' is not allowed. Please upload images, PDFs, or Office documents.`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (Cloudinary's limit is higher)
  },
  fileFilter: fileFilter
});

// Wrapper middleware for better error handling and logging
const uploadMiddleware = (req, res, next) => {
  console.log('\n🚀 === UPLOAD MIDDLEWARE STARTED ===');
  console.log('Request body:', req.body);
  console.log('Files in request:', req.files);
  
  upload.single("material")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer upload error:", err.message);
      
      // Handle specific error types
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
        console.log('\n🎉 === FILE UPLOADED SUCCESSFULLY ===');
        console.log('Original name:', req.file.originalname);
        console.log('Cloudinary public_id:', req.file.public_id);
        console.log('Cloudinary URL:', req.file.path);
        console.log('Secure URL:', req.file.secure_url);
        console.log('Resource type:', req.file.resource_type);
        console.log('Format:', req.file.format);
        console.log('Size:', req.file.size, 'bytes');
        console.log('Full file info:', JSON.stringify({
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          public_id: req.file.public_id,
          resource_type: req.file.resource_type,
          format: req.file.format,
          created_at: req.file.created_at,
          bytes: req.file.bytes,
          secure_url: req.file.secure_url,
          url: req.file.url,
          etag: req.file.etag
        }, null, 2));
        
        // Ensure the URL is accessible
        if (req.file.path) {
          // Test if URL is accessible (non-blocking)
          console.log("✅ Upload completed. File URL:", req.file.path);
        }
      } catch (e) {
        console.error("❌ Error logging file info:", e.message);
        console.log("Raw file object:", req.file);
      }
    } else {
      console.log("⚠️ No file in request. Check if field name is 'material'");
    }

    next();
  });
};

// Multiple file upload middleware (if needed)
const uploadMultipleMiddleware = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        console.error("❌ Multiple upload error:", err.message);
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Upload error' 
        });
      }
      
      if (req.files && req.files.length > 0) {
        console.log(`✅ Uploaded ${req.files.length} files`);
        req.files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.originalname} => ${file.path}`);
        });
      }
      
      next();
    });
  };
};

module.exports = upload;
module.exports.uploadMiddleware = uploadMiddleware;
module.exports.uploadMultipleMiddleware = uploadMultipleMiddleware;
module.exports.cloudinary = cloudinary;