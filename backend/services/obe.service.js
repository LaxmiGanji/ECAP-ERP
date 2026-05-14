// services/obe.service.js - FIXED VERSION
const mongoose = require('mongoose');
const CourseOutcome = require('../models/OBE/co.model');
const ProgramOutcome = require('../models/OBE/po.model');
const Assessment = require('../models/OBE/assessment.model');
const AssessmentComponent = require('../models/OBE/assessmentComponent.model');
const COMapping = require('../models/OBE/coPoMap.model');
const COAssessmentMap = require('../models/OBE/coAssessmentMap.model');
const Student = require('../models/Students/details.model');
const Subject = require('../models/Other/subject.model');
const Marks = require('../models/Other/marks.model');
const Branch = require('../models/Other/branch.model');

/**
 * Calculate CO Attainment with NBA/JNTUH format
 */
const computeCOAttainment = async ({ branch, semester, subjectId }) => {
  try {
    // Validate inputs
    if (!subjectId) {
      throw new Error('Subject ID is required');
    }

    // Get subject details
    const subject = await Subject.findById(subjectId)
      .populate('branch', 'name')
      .lean();
    
    if (!subject) {
      throw new Error('Subject not found');
    }

    // Get branch name for student filtering
    let branchName = branch;
    if (!branchName && subject.branch) {
      branchName = subject.branch.name || subject.branch;
    }

    // Get all COs for the subject
    const cos = await CourseOutcome.find({ subject: subjectId })
      .sort('code')
      .lean();

    // Get all assessment components for this subject
    const components = await AssessmentComponent.find({ subject: subjectId })
      .populate('assessment', 'name key examType maxMarks')
      .populate('co', 'code description')
      .lean();

    // Get students in this branch and semester
    let students = [];
    if (branchName && semester) {
      students = await Student.find({ 
        branch: branchName, 
        semester: parseInt(semester) 
      }).lean();
    } else {
      // Get all students taking this subject
      students = await Student.find({}).lean();
    }

    // Prepare CO rows for NBA format
    const coRows = await Promise.all(cos.map(async (co) => {
      // Get components for this CO
      const coComponents = components.filter(comp => 
        comp.co && comp.co._id.toString() === co._id.toString()
      );

      if (coComponents.length === 0) {
        return {
          subjectCode: subject.code,
          subjectName: subject.name,
          coCode: co.code,
          coDescription: co.description,
          target: co.target || 60,
          studentsGeTarget: 0,
          totalStudentsWithEvidence: 0,
          coAttainmentPercent: 0,
          contributingComponents: []
        };
      }

      // Calculate attainment for each student
      let studentsGeTarget = 0;
      let totalStudentsWithEvidence = 0;
      
      for (const student of students) {
        const marks = await Marks.findOne({ 
          enrollmentNo: student.enrollmentNo 
        }).lean();
        
        if (!marks) continue;
        
        let totalScore = 0;
        let maxPossible = 0;
        let hasEvidence = false;
        
        // Calculate score for this CO
        for (const comp of coComponents) {
          const key = comp.key || comp.assessment?.key;
          const maxMarks = comp.maxMarks || comp.assessment?.maxMarks || 0;
          
          // Check marks in internal/external
          let studentMark = null;
          if (marks.internal && marks.internal[key] !== undefined) {
            studentMark = parseFloat(marks.internal[key]);
          } else if (marks.external && marks.external[key] !== undefined) {
            studentMark = parseFloat(marks.external[key]);
          }
          
          if (studentMark !== null && !isNaN(studentMark) && maxMarks > 0) {
            totalScore += studentMark;
            maxPossible += maxMarks;
            hasEvidence = true;
          }
        }
        
        if (hasEvidence && maxPossible > 0) {
          totalStudentsWithEvidence++;
          const percentage = (totalScore / maxPossible) * 100;
          if (percentage >= (co.target || 60)) {
            studentsGeTarget++;
          }
        }
      }
      
      // Calculate CO attainment percentage
      const coAttainmentPercent = totalStudentsWithEvidence > 0 
        ? (studentsGeTarget / totalStudentsWithEvidence) * 100 
        : 0;
      
      // Format contributing components for display
      const contributingComponents = coComponents.map(comp => ({
        componentName: comp.componentName || comp.assessment?.name || comp.key,
        key: comp.key || comp.assessment?.key,
        maxMarks: comp.maxMarks || comp.assessment?.maxMarks || 0,
        assessmentName: comp.assessment?.name
      })).filter(comp => comp.maxMarks > 0);
      
      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        coCode: co.code,
        coDescription: co.description,
        target: co.target || 60,
        studentsGeTarget,
        totalStudentsWithEvidence,
        coAttainmentPercent: parseFloat(coAttainmentPercent.toFixed(2)),
        contributingComponents
      };
    }));

    return {
      success: true,
      subject: {
        id: subject._id,
        code: subject.code,
        name: subject.name,
        semester: subject.semester,
        branch: subject.branch
      },
      coRows,
      totalStudents: students.length
    };
  } catch (error) {
    console.error('CO Attainment Calculation Error:', error);
    throw error;
  }
};

/**
 * Calculate PO Attainment with NBA format
 */
const computePOAttainment = async ({ branch, semester }) => {
  try {
    if (!branch || !semester) {
      throw new Error('Branch and semester are required');
    }

    // Get branch details
    let branchDoc = await Branch.findOne({ 
      $or: [
        { _id: mongoose.isValidObjectId(branch) ? branch : null },
        { name: branch }
      ]
    }).lean();

    if (!branchDoc) {
      throw new Error('Branch not found');
    }

    // Get all subjects in this branch and semester
    const subjects = await Subject.find({ 
      $or: [
        { branch: branchDoc._id },
        { branch: branchDoc.name }
      ],
      semester: parseInt(semester)
    }).lean();

    // Calculate CO attainment for each subject
    const allCOAttainments = [];
    for (const subject of subjects) {
      try {
        const coResult = await computeCOAttainment({ 
          branch: branchDoc.name, 
          semester, 
          subjectId: subject._id 
        });
        allCOAttainments.push({
          subjectId: subject._id,
          subjectCode: subject.code,
          subjectName: subject.name,
          coRows: coResult.coRows
        });
      } catch (err) {
        console.warn(`Failed to calculate CO for subject ${subject.code}:`, err.message);
      }
    }

    // Get all POs for the branch
    const pos = await ProgramOutcome.find({ 
      branch: branchDoc._id 
    }).lean();

    // Get CO-PO mappings
    const coMappings = await COMapping.find({})
      .populate('co', 'code description subject')
      .populate('po', 'code description')
      .lean();

    // Calculate PO attainment
    const poResults = await Promise.all(pos.map(async (po) => {
      // Find all COs mapped to this PO
      const poMappings = coMappings.filter(mapping => 
        mapping.po && mapping.po._id.toString() === po._id.toString()
      );
      
      if (poMappings.length === 0) {
        return {
          poCode: po.code,
          poDescription: po.description,
          poAttainment: 0,
          contributingCOs: [],
          mappedSubjects: []
        };
      }

      // Calculate weighted average of mapped COs
      let totalWeightedAttainment = 0;
      let totalWeight = 0;
      const contributingCOs = [];
      const mappedSubjects = new Set();

      for (const mapping of poMappings) {
        const co = mapping.co;
        if (!co) continue;

        // Find this CO in our calculated results
        for (const subjectResult of allCOAttainments) {
          const coRow = subjectResult.coRows.find(cr => 
            cr.coCode === co.code
          );
          
          if (coRow && coRow.coAttainmentPercent > 0) {
            const weight = mapping.weight || 1;
            totalWeightedAttainment += coRow.coAttainmentPercent * weight;
            totalWeight += weight;
            
            contributingCOs.push({
              co: { code: co.code, description: co.description },
              mappingWeight: weight,
              attainmentPercent: coRow.coAttainmentPercent,
              subjectCode: subjectResult.subjectCode
            });
            
            mappedSubjects.add(subjectResult.subjectCode);
          }
        }
      }

      const poAttainment = totalWeight > 0 
        ? totalWeightedAttainment / totalWeight 
        : 0;

      return {
        poCode: po.code,
        poDescription: po.description,
        poAttainment: parseFloat(poAttainment.toFixed(2)),
        contributingCOs,
        mappedSubjects: Array.from(mappedSubjects)
      };
    }));

    // Prepare CO rows for all subjects (flattened)
    const coRows = allCOAttainments.flatMap(result => result.coRows);

    return {
      success: true,
      branch: branchDoc.name,
      semester,
      poResults: poResults.sort((a, b) => a.poCode.localeCompare(b.poCode)),
      coRows,
      totalSubjects: subjects.length
    };
  } catch (error) {
    console.error('PO Attainment Calculation Error:', error);
    throw error;
  }
};

/**
 * Generate NBA/JNTUH Format Excel Report
 */
const generateNBAFormatReport = async ({ branch, semester, subjectId, college, department, program, academicYear }) => {
  try {
    let report;
    let isSubjectReport = false;
    
    if (subjectId) {
      // Single subject CO report
      report = await computeCOAttainment({ branch, semester, subjectId });
      isSubjectReport = true;
    } else {
      // Full PO report with all subjects
      if (!branch || !semester) {
        throw new Error('Branch and semester are required for PO report');
      }
      report = await computePOAttainment({ branch, semester });
    }

    return {
      success: true,
      isSubjectReport,
      report,
      metadata: {
        college: college || 'ABC Engineering College',
        department: department || 'Computer Science and Engineering',
        program: program || 'B.Tech (CSE)',
        academicYear: academicYear || '2025-26',
        semester,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('NBA Format Report Generation Error:', error);
    throw error;
  }
};

module.exports = {
  computeCOAttainment,
  computePOAttainment,
  generateNBAFormatReport
};