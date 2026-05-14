const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('../models/Other/branch.model.js');
require('../models/HOD/credential.model.js');

const syncHODCredentials = async () => {
  try {
    await mongoose.connect('mongodb+srv://laxmiganji2005:Augtpaswd4$@cluster0.xqcmbub.mongodb.net/test?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    const Branch = mongoose.model('Branch');
    const HODCredential = mongoose.model('HOD Credential');

    const branches = await Branch.find();
    console.log(`Found ${branches.length} branches.`);

    for (const branch of branches) {
      const loginid = `hod_${branch.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      const existing = await HODCredential.findOne({ loginid });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('hod123', 10);
        await HODCredential.create({
          loginid,
          password: hashedPassword,
          branch: branch.name
        });
        console.log(`Created HOD for ${branch.name} (ID: ${loginid})`);
      } else {
        console.log(`HOD for ${branch.name} already exists.`);
      }
    }

    console.log('Sync complete.');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

syncHODCredentials();
