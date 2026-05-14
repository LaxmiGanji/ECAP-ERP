const mongoose = require('mongoose');

const CoattainmentSchema = new mongoose.Schema({
    enrollmentNo: { type: String, required: true },
    coData: [{
        coNumber: { type: Number, required: true },
        questions: [{
            questionNumber: { type: Number, required: true },
            subQuestions: [{
                subQuestionNumber: { type: String, required: true },
                marks: { type: Number, required: true },
                obtainedMarks: { type: Number, required: true }
            }],
            totalMarks: { type: Number, required: true },
            obtainedMarks: { type: Number, required: true }
        }],
        assignments: [{
            assignmentName: { type: String, required: true },
            totalMarks: { type: Number, required: true },
            obtainedMarks: { type: Number, required: true }
        }]
    }]
});

module.exports = mongoose.model('Coattainment', CoattainmentSchema);