// Dev-only seed script for OBE sample data
// Usage: node backend/scripts/seed_sample_obe.js [subjectCode=CS501] [branch=CSE] [semester=5]

const connectToMongo = require('../Database/db');
connectToMongo();
const CourseOutcome = require('../models/OBE/co.model');
const ProgramOutcome = require('../models/OBE/po.model');
const Assessment = require('../models/OBE/assessment.model');
const AssessmentComponent = require('../models/OBE/assessmentComponent.model');
const Subject = require('../models/Other/subject.model');
const Branch = require('../models/Other/branch.model');
const Student = require('../models/Students/details.model');
const Marks = require('../models/Other/marks.model');

(async () => {
  try {
    const args = process.argv.slice(2);
    const subjectCode = args[0] || 'CS501';
    const branchName = args[1] || 'CSE';
    const semester = Number(args[2] || 5);

    console.log('Seeding sample OBE data for', subjectCode, branchName, semester);

    let branch = await Branch.findOne({ name: branchName });
    if (!branch) branch = await Branch.create({ name: branchName });

    let subject = await Subject.findOne({ code: subjectCode });
    if (!subject) subject = await Subject.create({ name: 'Software Engineering', code: subjectCode, semester, branch: branch._id });

    // POs
    const poDefs = [
      { code: 'PO1', description: 'Engineering knowledge' },
      { code: 'PO2', description: 'Problem analysis' },
      { code: 'PO3', description: 'Design/develop' },
      { code: 'PO4', description: 'Investigate' },
      { code: 'PO5', description: 'Modern tools' }
    ];
    for (const p of poDefs) {
      let doc = await ProgramOutcome.findOne({ code: p.code, branch: branch._id });
      if (!doc) doc = await ProgramOutcome.create({ code: p.code, description: p.description, branch: branch._id });
    }

    // COs
    const coDefs = [
      { code: 'CO1', description: 'Understand sc' },
      { code: 'CO2', description: 'Apply requirements' },
      { code: 'CO3', description: 'Analyze design' },
      { code: 'CO4', description: 'Use testing techniques' },
      { code: 'CO5', description: 'Demonstrate teamwork' }
    ];
    for (const c of coDefs) {
      let doc = await CourseOutcome.findOne({ code: c.code, subject: subject._id });
      if (!doc) doc = await CourseOutcome.create({ code: c.code, description: c.description, subject: subject._id, target: 60 });
    }

    // Assessments
    const assessDefs = [
      { name: 'MID1', key: 'MID1', examType: 'internal', maxMarks: 50 },
      { name: 'MID2', key: 'MID2', examType: 'internal', maxMarks: 50 },
      { name: 'ASSIGN-1', key: 'ASSIGN1', examType: 'internal', maxMarks: 20 },
      { name: 'ASSIGN-2', key: 'ASSIGN2', examType: 'internal', maxMarks: 20 },
      { name: 'QUIZ', key: 'QUIZ', examType: 'internal', maxMarks: 10 },
      { name: 'SEMINAR', key: 'SEM', examType: 'internal', maxMarks: 30 }
    ];
    for (const a of assessDefs) {
      let doc = await Assessment.findOne({ key: a.key, subject: subject._id });
      if (!doc) doc = await Assessment.create({ ...a, subject: subject._id });
    }

    // Components and students/marks are similar to controller seed — you can also call the endpoint
    console.log('Seed script completed — run the API endpoint POST /api/obe/seed/sample to populate marks and generate report');
  } catch (err) {
    console.error('Seed script error', err);
  } finally {
    process.exit(0);
  }
})();
