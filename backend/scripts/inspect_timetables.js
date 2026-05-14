const mongoose = require('mongoose');
const Timetable = require('../models/Other/timetable.model');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/test'); // may need credentials? replicates earlier connect
  const docs = await Timetable.find({ branch: 'CSE', semester: 7, section: 'ATT' });
  console.log('found', docs.length, docs.map(d=>({id:d._id,isAuto:d.isAuto}))); 
  process.exit();
}
run().catch(console.error);
