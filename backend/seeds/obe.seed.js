// Simple seeder for OBE models (COs, POs, Assessments, Mappings)
const mongoose = require('mongoose');
require('dotenv').config();
const connectToMongo = require('../Database/db');
const CourseOutcome = require('../models/OBE/co.model');
const ProgramOutcome = require('../models/OBE/po.model');
const Assessment = require('../models/OBE/assessment.model');
const COAssessmentMap = require('../models/OBE/coAssessmentMap.model');
const COMapping = require('../models/OBE/coPoMap.model');
const Subject = require('../models/Other/subject.model');

async function seed() {
  try {
    await connectToMongo();

    // NOTE: Adjust subject lookup as per your DB; we'll pick the first subject found
    const subject = await Subject.findOne();
    if (!subject) {
      console.log('No subjects found; please create subjects first.');
      process.exit(0);
    }

    // Create program outcomes
    const po1 = await ProgramOutcome.create({ code: 'PO1', description: 'Engineering knowledge' });
    const po2 = await ProgramOutcome.create({ code: 'PO2', description: 'Problem analysis' });

    // Create COs for subject
    const co1 = await CourseOutcome.create({ code: 'CO1', description: 'Understand basics', subject: subject._id, target: 60 });
    const co2 = await CourseOutcome.create({ code: 'CO2', description: 'Apply concepts', subject: subject._id, target: 60 });

    // Create assessments
    const a1 = await Assessment.create({ name: 'Quiz 1', key: 'quiz1', subject: subject._id, examType: 'internal', maxMarks: 10 });
    const a2 = await Assessment.create({ name: 'Mid', key: 'mid', subject: subject._id, examType: 'internal', maxMarks: 40 });

    // Map assessments to COs
    await COAssessmentMap.create({ assessment: a1._id, co: co1._id, weight: 1 });
    await COAssessmentMap.create({ assessment: a2._id, co: co2._id, weight: 2 });

    // Map COs to POs (weights 1/2/3)
    await COMapping.create({ co: co1._id, po: po1._id, weight: 2 });
    await COMapping.create({ co: co2._id, po: po2._id, weight: 3 });

    console.log('OBE seed completed.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
