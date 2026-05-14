const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
    faculty: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add indexes for better query performance
MaterialSchema.index({ faculty: 1, createdAt: -1 });
MaterialSchema.index({ subject: 1 });
MaterialSchema.index({ branch: 1, semester: 1 });

module.exports = mongoose.model("Material", MaterialSchema);