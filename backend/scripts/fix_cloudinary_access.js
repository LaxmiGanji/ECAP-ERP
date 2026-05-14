const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fixCloudinaryAccess() {
  try {
    console.log('🔄 Fetching all files from Cloudinary...');

    // Get all files from college-cms folders
    const folders = ['college-cms/materials', 'college-cms/profiles', 'college-cms/certifications', 'college-cms/notices', 'college-cms/newspapers', 'college-cms/timetables'];

    for (const folder of folders) {
      console.log(`\n📁 Processing folder: ${folder}`);

      try {
        const resources = await cloudinary.api.resources({
          type: 'upload',
          prefix: folder,
          max_results: 500,
        });

        if (resources.resources.length === 0) {
          console.log(`  ℹ️ No files found in ${folder}`);
          continue;
        }

        console.log(`  ℹ️ Found ${resources.resources.length} files`);

        for (const resource of resources.resources) {
          try {
            // Use cloudinary.url to regenerate the URL with auth disabled
            // The key is to ensure the file URL is publicly accessible
            const url = cloudinary.url(resource.public_id, {
              secure: true,
              type: 'upload',
              resource_type: resource.resource_type,
            });

            console.log(`  ℹ️ File: ${resource.public_id} (Type: ${resource.resource_type})`);
            console.log(`     URL: ${url}`);
          } catch (error) {
            console.error(`  ❌ Error processing ${resource.public_id}:`, error.message);
          }
        }
      } catch (folderError) {
        console.log(`  ⚠️ Could not access ${folder}:`, folderError.message);
      }
    }

    console.log('\n✅ File listing completed!');
    console.log('\n📝 Note: Files are stored but may have restricted delivery settings.');
    console.log('   Check Cloudinary dashboard to ensure "Allowed for delivery" is set.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCloudinaryAccess();
