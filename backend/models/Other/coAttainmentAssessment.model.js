const mongoose = require('mongoose');

const StudentMarkSchema = new mongoose.Schema({
    enrollmentNo: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    questionMarks: [{
        questionNumber: {
            type: Number,
            required: true
        },
        subQuestionMarks: [{
            subQuestionNumber: {
                type: String,
                required: true
            },
            marks: {
                type: Number,
                required: true
            },
            obtainedMarks: {
                type: Number,
                default: 0
            }
        }],
        totalMarks: {
            type: Number,
            required: true
        },
        obtainedMarks: {
            type: Number,
            default: 0
        }
    }],
    assignmentMarks: [{
        assignmentNumber: {
            type: String,
            required: true
        },
        totalMarks: {
            type: Number,
            required: true
        },
        obtainedMarks: {
            type: Number,
            default: 0
        }
    }],
    totalObtainedMarks: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    attainmentLevel: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    }
}, { _id: false });

const CoAttainmentAssessmentSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FacultyCredential',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    coNumber: {
        type: String,
        required: true
    },
    coDescription: {
        type: String,
        required: false
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    branchName: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    academicYear: {
        type: String,
        required: true
    },
    // Assessment structure
    questions: [{
        questionNumber: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: false
        },
        totalMarks: {
            type: Number,
            required: true
        },
        subQuestions: [{
            subQuestionNumber: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: false
            },
            totalMarks: {
                type: Number,
                required: true
            }
        }]
    }],
    assignments: [{
        assignmentNumber: {
            type: String,
            required: true
        },
        assignmentName: {
            type: String,
            required: false
        },
        totalMarks: {
            type: Number,
            required: true
        }
    }],
    totalMarks: {
        type: Number,
        required: true,
        default: 0
    },
    // Student marks data
    studentMarks: [StudentMarkSchema],
    // Summary data
    summary: {
        totalStudents: {
            type: Number,
            default: 0
        },
        studentsAppeared: {
            type: Number,
            default: 0
        },
        averagePercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        averageMarks: {
            type: Number,
            default: 0
        },
        attainmentLevel: {
            type: Number,
            enum: [1, 2, 3],
            default: 1
        },
        levelDistribution: {
            level3: {
                type: Number,
                default: 0
            },
            level2: {
                type: Number,
                default: 0
            },
            level1: {
                type: Number,
                default: 0
            }
        },
        calculatedAt: {
            type: Date,
            default: Date.now
        }
    },
    status: {
        type: String,
        enum: ['draft', 'template_generated', 'marks_uploaded', 'completed'],
        default: 'draft'
    },
    remarks: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for quick queries
CoAttainmentAssessmentSchema.index({ facultyId: 1, academicYear: 1 });
CoAttainmentAssessmentSchema.index({ subjectId: 1, coNumber: 1, academicYear: 1 });
CoAttainmentAssessmentSchema.index({ branchId: 1, semester: 1, academicYear: 1 });

module.exports = mongoose.model('CoAttainmentAssessment', CoAttainmentAssessmentSchema);
