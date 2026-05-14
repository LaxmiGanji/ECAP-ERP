const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("✅ Download controller initialized with Cloudinary");

/**
 * Main download function - handles file downloads from Cloudinary or other URLs
 */
const downloadFile = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: "URL is required" 
      });
    }

    console.log("📥 Download request received for:", url);

    // Check if it's a Cloudinary URL
    const isCloudinaryUrl = url.includes('cloudinary.com') && url.includes('/upload/');
    
    if (isCloudinaryUrl) {
      console.log("☁️ Cloudinary URL detected");
      return handleCloudinaryDownload(url, req, res);
    } else {
      console.log("🔗 Direct URL detected");
      return handleDirectDownload(url, req, res);
    }
  } catch (error) {
    console.error('❌ Download controller error:', error.message);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Failed to process download request",
      error: error.message,
      suggestion: "Try accessing the file directly or contact support"
    });
  }
};

/**
 * Handle Cloudinary file downloads
 */
const handleCloudinaryDownload = async (url, req, res) => {
  try {
    console.log("🔄 Processing Cloudinary download...");
    
    // Extract public ID from URL
    let publicId = extractPublicIdFromUrl(url);
    
    if (!publicId) {
      console.log("❌ Could not extract public ID from URL");
      return res.status(400).json({
        success: false,
        message: "Invalid Cloudinary URL format"
      });
    }

    console.log("🔍 Extracted public ID:", publicId);
    
    // Get resource info from Cloudinary
    let resourceInfo;
    try {
      resourceInfo = await cloudinary.api.resource(publicId, {
        resource_type: 'auto'
      });
      console.log("✅ Resource info retrieved:", {
        format: resourceInfo.format,
        resource_type: resourceInfo.resource_type,
        bytes: resourceInfo.bytes,
        created_at: resourceInfo.created_at
      });
    } catch (apiError) {
      console.warn("⚠️ Could not fetch resource info, proceeding anyway:", apiError.message);
      resourceInfo = {};
    }
    
    // Generate a signed URL with download flag
    // Cloudinary signed URLs are more reliable for downloads
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'auto',
      secure: true,
      sign_url: true,
      type: 'authenticated',
      attachment: true, // Force download
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      flags: 'attachment',
      format: resourceInfo.format || 'pdf' // Default to PDF if unknown
    });
    
    console.log("🔗 Generated signed download URL:", signedUrl);
    
    // Extract filename
    const filename = generateFilename(publicId, resourceInfo.format);
    console.log("📄 Download filename:", filename);
    
    // Method 1: Redirect to signed URL (simplest and fastest)
    console.log("⏩ Redirecting to signed URL for direct download...");
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', getContentType(resourceInfo.format) || 'application/octet-stream');
    res.setHeader('X-File-Name', filename);
    res.setHeader('X-Cloudinary-Public-Id', publicId);
    
    // Redirect to Cloudinary signed URL
    return res.redirect(signedUrl);
    
  } catch (error) {
    console.error('❌ Cloudinary download error:', error.message);
    
    // Fallback: Try direct streaming
    try {
      console.log("🔄 Attempting fallback direct stream...");
      return await streamCloudinaryFile(url, res);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      
      return res.status(500).json({
        success: false,
        message: "Failed to download Cloudinary file",
        error: error.message,
        fallback_error: fallbackError.message,
        suggestion: "Try accessing the file directly from Cloudinary dashboard"
      });
    }
  }
};

/**
 * Handle direct URL downloads (non-Cloudinary)
 */
const handleDirectDownload = async (url, req, res) => {
  try {
    console.log("🌐 Downloading from direct URL...");
    
    // Fetch the file
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      validateStatus: (status) => status < 400 // Accept any 2xx or 3xx status
    });
    
    console.log("✅ Direct fetch successful, status:", response.status);
    
    // Extract filename from URL or headers
    let filename = 'download';
    
    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename=["']?([^"'\s]+)["']?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }
    
    // Fallback: Extract from URL
    if (filename === 'download') {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart.split('?')[0];
        filename = decodeURIComponent(filename);
      }
    }
    
    // Clean filename
    filename = sanitizeFilename(filename);
    
    console.log("📄 Direct download filename:", filename);
    
    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Length', response.headers['content-length'] || 'unknown');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Pipe the stream to response
    response.data.pipe(res);
    
    // Handle stream errors
    response.data.on('error', (streamError) => {
      console.error('❌ Stream error during download:', streamError.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Stream error during download"
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Direct download error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to download file from URL",
      error: error.message,
      status: error.response?.status
    });
  }
};

/**
 * Fallback: Stream Cloudinary file directly
 */
const streamCloudinaryFile = async (url, res) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    .then(response => {
      // Extract filename
      const urlParts = url.split('/');
      let filename = urlParts[urlParts.length - 1];
      filename = filename.split('?')[0] || 'download';
      filename = decodeURIComponent(filename);
      filename = sanitizeFilename(filename);
      
      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      
      // Pipe to response
      response.data.pipe(res);
      
      // Handle completion
      response.data.on('end', () => {
        console.log("✅ Stream completed");
        resolve();
      });
      
      // Handle errors
      response.data.on('error', (err) => {
        console.error('❌ Stream error:', err.message);
        reject(err);
      });
    })
    .catch(error => {
      console.error('❌ Stream request failed:', error.message);
      reject(error);
    });
  });
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicIdFromUrl = (url) => {
  try {
    // Pattern: /upload/[version]/[public_id]
    const match = url.match(/\/upload\/(?:v\d+\/)?([^?#]+)/);
    if (match && match[1]) {
      // Remove file extension
      let publicId = match[1];
      const lastDotIndex = publicId.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        publicId = publicId.substring(0, lastDotIndex);
      }
      return publicId;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error.message);
    return null;
  }
};

/**
 * Generate a safe filename
 */
const generateFilename = (publicId, format) => {
  try {
    // Extract the last part of public ID (after last slash)
    const parts = publicId.split('/');
    let name = parts[parts.length - 1];
    
    // Replace underscores and dashes with spaces
    name = name.replace(/[_-]/g, ' ');
    
    // Remove any Cloudinary transformation suffixes
    name = name.replace(/\s+v\d+$/, '');
    
    // Add file extension if we have format info
    if (format) {
      name = `${name}.${format.toLowerCase()}`;
    } else {
      // Try to guess from publicId
      if (publicId.includes('.') && !name.includes('.')) {
        const extMatch = publicId.match(/\.([a-zA-Z0-9]+)$/);
        if (extMatch) {
          name = `${name}.${extMatch[1]}`;
        }
      }
    }
    
    // Sanitize filename
    name = sanitizeFilename(name);
    
    return name;
  } catch (error) {
    console.error('Error generating filename:', error.message);
    return `download_${Date.now()}.pdf`;
  }
};

/**
 * Sanitize filename for safe download
 */
const sanitizeFilename = (filename) => {
  if (!filename) return `download_${Date.now()}.pdf`;
  
  // Remove path traversal attempts
  filename = filename.replace(/\.\.\//g, '');
  filename = filename.replace(/\.\.\\/g, '');
  
  // Replace invalid characters
  filename = filename.replace(/[<>:"/\\|?*]/g, '_');
  
  // Limit length
  if (filename.length > 200) {
    const extension = filename.substring(filename.lastIndexOf('.'));
    const name = filename.substring(0, 200 - extension.length);
    filename = name + extension;
  }
  
  // Ensure it has an extension
  if (!filename.includes('.')) {
    filename = filename + '.pdf';
  }
  
  return filename;
};

/**
 * Get content type based on file format
 */
const getContentType = (format) => {
  const contentTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
  };
  
  return contentTypes[format?.toLowerCase()] || 'application/octet-stream';
};

/**
 * Simple direct download endpoint (alternative)
 */
const directDownload = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: "URL query parameter is required" 
      });
    }
    
    console.log("🔗 Direct download endpoint called for:", url);
    
    // Simply redirect to the URL (browser will handle download)
    return res.redirect(url);
    
  } catch (error) {
    console.error('❌ Direct download endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      message: "Direct download failed",
      error: error.message
    });
  }
};

/**
 * Test endpoint to verify Cloudinary configuration
 */
const testCloudinary = async (req, res) => {
  try {
    console.log("🧪 Testing Cloudinary configuration...");
    
    const testData = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set (hidden)' : '❌ Missing',
    };
    
    // Try to ping Cloudinary
    let pingResult;
    try {
      pingResult = await cloudinary.api.ping();
      testData.ping = pingResult.status === 'ok' ? '✅ Success' : `❌ Failed: ${JSON.stringify(pingResult)}`;
    } catch (pingError) {
      testData.ping = `❌ Error: ${pingError.message}`;
    }
    
    res.json({
      success: true,
      message: "Cloudinary test results",
      data: testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cloudinary test error:', error.message);
    res.status(500).json({
      success: false,
      message: "Cloudinary test failed",
      error: error.message
    });
  }
};

module.exports = { 
  downloadFile, 
  directDownload,
  testCloudinary,
  // Helper functions for testing
  extractPublicIdFromUrl,
  generateFilename,
  sanitizeFilename
};