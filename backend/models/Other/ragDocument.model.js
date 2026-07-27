const mongoose = require("mongoose");

const ragDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["catalog", "research_paper", "pyq"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "Unknown",
    },
    journal: {
      type: String,
      default: "",
    },
    publisher: {
      type: String,
      default: "",
    },
    publishedYear: {
      type: Number,
    },
    branch: {
      type: String,
      default: "General",
    },
    subject: {
      type: String,
      default: "General",
    },
    semester: {
      type: Number,
    },
    examType: {
      type: String,
      default: "Semester Exam", // Mid 1, Mid 2, Semester Exam
    },
    rackNumber: {
      type: String,
      default: "",
    },
    bookCode: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    availableCount: {
      type: Number,
      default: 1,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    downloadUrl: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
      },
    ],
    embedding: [
      {
        type: Number,
      },
    ],
    pineconeId: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for text search fallback
ragDocumentSchema.index({ title: "text", content: "text", summary: "text", tags: "text" });

module.exports = mongoose.model("RAGDocument", ragDocumentSchema);
