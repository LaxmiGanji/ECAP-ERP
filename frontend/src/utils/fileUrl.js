/**
 * Utility function to get the correct URL for files
 * Handles both Cloudinary URLs (full URLs) and local file paths
 * @param {string} filePath - The file path or Cloudinary URL
 * @returns {string} - The complete URL
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  
  // If it's already a full URL (Cloudinary), return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Otherwise, prepend the local media link (for backward compatibility)
  return `${process.env.REACT_APP_MEDIA_LINK}/${filePath}`;
};
