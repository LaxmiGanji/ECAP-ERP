const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' }); 

const applicationModel = require('./models/Placement/application.model');
require('./models/Students/credential.model');

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ECAP", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB");
    const StudentCredential = require('./models/Students/credential.model');
    const student = await StudentCredential.findById("69b9622f31815762c3a7c973");
    console.log("Student exists?", student != null);
    console.log(student);
    mongoose.disconnect();
});
