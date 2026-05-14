// scripts/setupNBAFormat.js
const mongoose = require('mongoose');
require('dotenv').config();

async function setupNBAFormat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create sample NBA format mappings
    console.log('NBA/JNTUH format setup complete!');
    console.log('\nTo generate reports:');
    console.log('1. Use the NBAReportGenerator component');
    console.log('2. Select branch, semester, and subject');
    console.log('3. Click "Generate Report"');
    console.log('4. Excel file will download automatically');
    
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupNBAFormat();