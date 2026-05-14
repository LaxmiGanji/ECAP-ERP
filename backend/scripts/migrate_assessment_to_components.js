/**
 * Migration script: convert existing Assessment->CO mappings into AssessmentComponent rows.
 * - For each assessment, gather its CO mappings and split the assessment maxMarks among COs by mapping weight.
 * - If assessment has no CO mappings, skip (or optionally create a single component mapping to a default CO)
 * Usage: node scripts/migrate_assessment_to_components.js
 */
//migrate_assessment_to_components.js
const mongoose = require('mongoose');
const Assessment = require('../models/OBE/assessment.model');
const COAssessmentMap = require('../models/OBE/coAssessmentMap.model');
const AssessmentComponent = require('../models/OBE/assessmentComponent.model');
const db = require('../Database/db'); // ensure this initializes a connection

async function run() {
  try {
    console.log('Starting migration...');
    // ensure DB connection
    await db.connect();

    const assessments = await Assessment.find({}).lean();

    for (const a of assessments) {
      const maps = await COAssessmentMap.find({ assessment: a._id }).lean();
      if (!maps || maps.length === 0) continue; // nothing to migrate

      const totalWeight = maps.reduce((s, m) => s + (m.weight || 1), 0) || 1;
      const comps = maps.map(m => ({
        subject: a.subject,
        assessment: a._id,
        co: m.co,
        componentName: `${a.name} - ${m.co}`,
        key: a.key,
        examType: a.examType,
        maxMarks: (a.maxMarks || 0) * ((m.weight || 1) / totalWeight),
        shareWeight: m.weight || 1
      }));

      await AssessmentComponent.insertMany(comps, { ordered: false }).catch(e => console.warn('partial insert for assessment', a._id, e && e.message));
      console.log(`Migrated assessment ${a._id} to ${comps.length} components`);
    }

    console.log('Migration finished');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();