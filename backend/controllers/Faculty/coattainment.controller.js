const CoAttainmentAssessment = require('../../models/Other/coAttainmentAssessment.model');
const Subject = require('../../models/Other/subject.model');
const Branch = require('../../models/Other/branch.model');
const Student = require('../../models/Students/details.model');
const coattainmentService = require('../../services/coattainment.faculty.service');
const { filterSubjectsByStudentRegulation } = require('../../utils/subjectFilter');

/**
 * Get all subjects for a faculty with their COs
 */
exports.getSubjectsWithCOs = async (req, res) => {
    try {
        const { facultyId } = req.body;
        
        if (!facultyId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faculty ID is required' 
            });
        }

        let subjects = await Subject.find()
            .populate('branch', 'name')
            .select('code name semester courseOutcomes branch regulation');

        return res.status(200).json({
            success: true,
            message: 'Subjects fetched successfully',
            data: subjects
        });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal Server Error' 
        });
    }
};

/**
 * Get students for a specific branch and semester
 */
exports.getStudentsForAssessment = async (req, res) => {
    try {
        const { branchId, semester } = req.body;

        if (!branchId || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Branch ID and semester are required'
            });
        }

        // Fetch branch details
        const branch = await Branch.findById(branchId);
        const branchName = branch ? branch.name : branchId.toString();

        const students = await Student.find({
            $or: [
                { branch: branchName },  // If branch is stored as name
                { branch: branchId.toString() }  // If branch is stored as ID
            ],
            semester: semester,
            status: 'active'
        }).select('enrollmentNo firstName lastName middleName');

        return res.status(200).json({
            success: true,
            message: 'Students fetched successfully',
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Create CO Assessment (Initialize Assessment)
 */
exports.createAssessment = async (req, res) => {
    try {
        const { 
            facultyId, 
            subjectId, 
            coNumber, 
            branchId, 
            semester,
            academicYear,
            questions,
            assignments
        } = req.body;

        // Validation
        if (!facultyId || !subjectId || !coNumber || !branchId || !semester || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided: facultyId, subjectId, coNumber, branchId, semester, academicYear'
            });
        }

        if ((!questions || questions.length === 0) && (!assignments || assignments.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one question or assignment must be provided'
            });
        }

        const result = await coattainmentService.createAssessment({
            facultyId,
            subjectId,
            coNumber,
            branchId,
            semester,
            academicYear,
            questions: questions || [],
            assignments: assignments || []
        });

        return res.status(200).json({
            success: true,
            message: 'Assessment created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating assessment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Generate Excel Template for marks entry
 */
exports.generateExcelTemplate = async (req, res) => {
    try {
        const { assessmentId } = req.body;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const excelBuffer = await coattainmentService.generateExcelTemplate(assessmentId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="CO_Assessment_${assessmentId}.xlsx"`);
        res.setHeader('Content-Length', excelBuffer.length);
        res.end(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel template:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Upload and process marks from Excel
 */
exports.uploadMarks = async (req, res) => {
    try {
        const { assessmentId } = req.body;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required'
            });
        }

        const result = await coattainmentService.uploadAndProcessMarks(assessmentId, req.file.buffer);

        return res.status(200).json({
            success: true,
            message: 'Marks uploaded and processed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error uploading marks:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Get assessment by ID
 */
exports.getAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const assessment = await CoAttainmentAssessment.findById(assessmentId)
            .populate('facultyId', 'firstName lastName email')
            .populate('subjectId', 'code name')
            .populate('branchId', 'name');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Assessment retrieved successfully',
            data: assessment
        });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Get all assessments for a faculty
 */
exports.getFacultyAssessments = async (req, res) => {
    try {
        const { facultyId } = req.body;
        const { academicYear } = req.query;

        if (!facultyId) {
            return res.status(400).json({
                success: false,
                message: 'Faculty ID is required'
            });
        }

        let query = { facultyId };
        if (academicYear) {
            query.academicYear = academicYear;
        }

        const assessments = await CoAttainmentAssessment.find(query)
            .populate('subjectId', 'code name')
            .populate('branchId', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Assessments retrieved successfully',
            data: assessments
        });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Calculate and finalize assessment results
 */
exports.calculateResults = async (req, res) => {
    try {
        const { assessmentId } = req.body;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const result = await coattainmentService.calculateResults(assessmentId);

        return res.status(200).json({
            success: true,
            message: 'Results calculated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error calculating results:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Get summary and statistics for CO attainment
 */
exports.getAssessmentSummary = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const assessment = await CoAttainmentAssessment.findById(assessmentId)
            .populate('subjectId', 'code name')
            .populate('branchId', 'name');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Summary retrieved successfully',
            data: {
                subjectCode: assessment.subjectCode,
                subjectName: assessment.subjectName,
                coNumber: assessment.coNumber,
                coDescription: assessment.coDescription,
                branch: assessment.branchName,
                semester: assessment.semester,
                academicYear: assessment.academicYear,
                summary: assessment.summary,
                status: assessment.status
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Export results to Excel
 */
exports.exportResults = async (req, res) => {
    try {
        const { assessmentId } = req.body;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const excelBuffer = await coattainmentService.generateResultsExcel(assessmentId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="CO_Results_${assessmentId}.xlsx"`);
        res.setHeader('Content-Length', excelBuffer.length);
        res.end(excelBuffer);
    } catch (error) {
        console.error('Error exporting results:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Update assessment (edit questions, assignments)
 */
exports.updateAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { questions, assignments } = req.body;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const assessment = await CoAttainmentAssessment.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        if (assessment.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only edit assessments in draft status'
            });
        }

        if (questions) {
            assessment.questions = questions;
        }
        if (assignments) {
            assessment.assignments = assignments;
        }

        // Recalculate total marks
        let totalMarks = 0;
        assessment.questions.forEach(q => {
            if (q.subQuestions && q.subQuestions.length > 0) {
                q.subQuestions.forEach(sq => {
                    totalMarks += sq.totalMarks;
                });
            } else {
                totalMarks += q.totalMarks;
            }
        });
        assessment.assignments.forEach(a => {
            totalMarks += a.totalMarks;
        });

        assessment.totalMarks = totalMarks;
        await assessment.save();

        return res.status(200).json({
            success: true,
            message: 'Assessment updated successfully',
            data: assessment
        });
    } catch (error) {
        console.error('Error updating assessment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};

/**
 * Delete assessment
 */
exports.deleteAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        if (!assessmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assessment ID is required'
            });
        }

        const assessment = await CoAttainmentAssessment.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        await CoAttainmentAssessment.findByIdAndDelete(assessmentId);

        return res.status(200).json({
            success: true,
            message: 'Assessment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting assessment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
